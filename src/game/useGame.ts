/// <reference types="vite/client" />
import { useEffect, useState } from 'react';
import { useLiveEvents } from '../live/useLiveEvents';
import type { LiveStatus } from '../live/types';
import { voice, speakableName } from '../live/voice';
import { containsBanned } from '../live/bannedWords';
import { NameBatcher } from '../live/scoreboard';
import { detectWish, GiftThanker, makePicker, OncePerPerson, RecentPeople, WishLimiter } from '../live/chatter';
import { IS_STAGE } from '../live/page';
import { GAME } from './config';
import { KyThi, parseMc, type Ev, type View } from './thi';
import bankText from './cau-hoi/trac-nghiem.txt?raw';

const pick = makePicker();
const post = (url: string, body: unknown) =>
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => {});

/**
 * Trang stage chạy game thật (KyThi) và gửi ảnh chụp lên server.
 * Trang điều khiển chỉ vẽ lại ảnh chụp đó, không tự chạy game (tránh 2 bộ câu khác nhau).
 */
export function useGame() {
  const [status, setStatus] = useState<LiveStatus | null>(null);
  const [view, setView] = useState<View | null>(null);
  const [channelName, setChannelName] = useState(GAME.defaultChannelName);
  const [room] = useState(() => new KyThi(parseMc(bankText)));
  const [talk] = useState(() => ({
    greeter: new NameBatcher(
      GAME.greetEveryMs,
      GAME.namesPerGreeting,
      (names) => voice.say(GAME.greeting(joinNames(names))),
      () => voice.waiting >= 1,
    ),
    gifts: new GiftThanker(GAME.giftThanksCooldownMs, GAME.bigGiftCoins),
    follows: new OncePerPerson(),
    wishes: new WishLimiter(GAME.wishPerUserMs, GAME.wishGlobalMs),
    recent: new RecentPeople(),
  }));
  const [kenh] = useState(() => ({ current: GAME.defaultChannelName }));
  kenh.current = channelName;

  // Tên an toàn để hiện/đọc: tên có từ cấm thì dùng username
  const safeName = (nickname: string, username: string) => (containsBanned(nickname) ? username : nickname);

  // Quan chủ khảo đọc theo sự kiện của game. Câu của game đi làn ưu tiên để không bị lời chào chen trước.
  const speak = (ev: Ev) => {
    const L = GAME.loi;
    switch (ev.t) {
      case 'cho':
        return voice.say(pick(L.cho) ?? '', true);
      case 'vong':
        if (ev.vong === 0) void post('/api/da-hoi', room.used); // ván mới vừa bốc câu: lưu lại để lần sau ưu tiên câu khác
        return voice.say(L.vong[ev.vong] ?? '', true);
      case 'doc': {
        const cau = room.cau;
        // Đọc xong đề mới hiện 4 đáp án và tính giờ
        return voice.say(ev.text, true, () => room.cau === cau && room.docXong(Date.now()));
      }
      case 'dapAn': {
        const nhanh = ev.nhanh ? speakableName(ev.nhanh) : 'bạn';
        const them =
          ev.soDung === 0 ? pick(L.khongAi) : ev.soDung === 1 ? L.dungMot(nhanh) : pick(L.dungNhieu)?.(ev.soDung, nhanh);
        return voice.say(`${L.dapAn(ev.chu, ev.dap)} ${them ?? ''}`, true);
      }
      case 'bangVang':
        return voice.say(ev.dau ? L.bangVang(ev.vong, speakableName(ev.dau)) : L.bangVangTrong(ev.vong), true);
      case 'vinhQuy': {
        const [tn, bn, th] = ev.top.map(speakableName);
        return voice.say(tn ? L.vinhQuy(tn, bn, th) : L.khongAiThi, true);
      }
    }
  };

  useLiveEvents({
    onStatus: setStatus,
    onGameState: (s) => !IS_STAGE && setView(s),

    onChat: (e) => {
      if (!IS_STAGE) return;
      const name = safeName(e.nickname, e.username);
      room.chat({ id: e.username, name, avatar: e.avatar, comment: e.comment, createTime: e.createTime }, Date.now());
      talk.recent.note(e.username, speakableName(name));
      // Comment có lời cầu chúc -> đọc 1 câu chúc soạn sẵn (không bao giờ đọc nguyên văn comment)
      const topic = containsBanned(e.comment) ? null : detectWish(e.comment);
      const reply = topic && pick(GAME.wishReplies[topic] ?? []);
      if (reply && talk.wishes.allow(e.username)) voice.say(reply(speakableName(name)));
    },

    onGift: (e) => {
      if (!IS_STAGE) return;
      const name = safeName(e.nickname, e.username);
      const coins = e.diamondCount * e.repeatCount;
      // Quà không cho lợi thế trong game, chỉ cảm ơn (combo 1 lần / 30 giây, quà to luôn cảm ơn)
      if (talk.gifts.shouldThank(e.username, coins, voice.waitingPriority)) {
        voice.say(GAME.thankGift(speakableName(name), e.giftName, kenh.current), true);
        const wish = pick(GAME.giftWishes);
        if (wish) voice.say(wish, true);
      }
    },

    onMember: (e) => {
      if (!IS_STAGE) return;
      const spoken = speakableName(safeName(e.nickname, e.username));
      if (spoken !== 'bạn') talk.greeter.add(e.username, spoken);
    },

    onFollow: (e) => {
      if (!IS_STAGE) return;
      if (talk.follows.first(e.username)) voice.say(GAME.thankFollow(speakableName(safeName(e.nickname, e.username)), kenh.current));
    },

    onControl: (c) => {
      if (c.action === 'setName' && c.text) setChannelName(c.text);
      if (!IS_STAGE) return; // chỉ trang stage làm theo lệnh, tránh 2 giọng
      const now = Date.now();
      if (c.action === 'speak' && c.text) voice.say(c.text, true);
      if (c.action === 'setRate' && c.text) voice.rate = Number(c.text) || 1;
      if (c.action === 'reset') {
        voice.stop();
        room.cho(now);
      }
      if (c.action === 'custom' && c.text === 'batdau') {
        voice.stop();
        room.batDau(now);
      }
      if (c.action === 'custom' && c.text === 'bocau') room.boCau(now);
    },
  });

  // Vòng chạy game trên trang stage
  useEffect(() => {
    if (!IS_STAGE) return;
    let ready = false;
    let lastPost = 0;
    fetch('/api/da-hoi')
      .then((r) => r.json())
      .then((u) => Object.assign(room.used, u))
      .catch(() => {})
      .finally(() => {
        room.cho(Date.now());
        ready = true;
      });
    const id = setInterval(() => {
      if (!ready) return;
      const now = Date.now();
      room.tick(now);
      room.lay().forEach(speak);
      const v = room.view(now);
      setView(v);
      if (now - lastPost >= 500) {
        lastPost = now;
        void post('/api/game/state', v);
      }
    }, 250);
    const share = setInterval(() => {
      const line = pick(GAME.shareLines);
      if (line) voice.say(line);
    }, GAME.shareReminderEveryMs);
    return () => {
      clearInterval(id);
      clearInterval(share);
    };
  }, []);

  return { status, channelName, view };
}

export type GameState = ReturnType<typeof useGame>;

// ['An', 'Bình', 'Chi'] -> 'An, Bình và Chi'
function joinNames(names: string[]) {
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} và ${names[names.length - 1]}` : names[0] ?? '';
}
