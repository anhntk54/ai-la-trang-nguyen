import { useEffect, useState } from 'react';
import { IS_STAGE } from './live/page';
import { StageFrame } from './live/StageFrame';
import { Dashboard } from './live/Dashboard';
import { voice } from './live/voice';
import { sfx } from './game/sfx';
import { useGame } from './game/useGame';
import { GameStage } from './game/GameStage';
import { GameControls } from './game/GameControls';

export default function App() {
  const game = useGame();
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    voice.onBlocked = () => setBlocked(true);
  }, []);

  // Trang cho TikTok LIVE Studio: chỉ có màn hình game
  if (IS_STAGE) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black" onClick={() => {
          setBlocked(false);
          sfx.resume();
        }}>
        <StageFrame>
          <GameStage game={game} />
        </StageFrame>
        {/* Chrome chặn tiếng tới khi bấm vào trang. LIVE Studio không chặn nên nút này không hiện trên live. */}
        {blocked && (
          <button className="fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-full bg-amber-500 px-8 py-4 text-2xl font-bold text-white shadow-2xl">
            🔊 Bấm vào đây để bật tiếng
          </button>
        )}
      </div>
    );
  }

  // Trang điều khiển
  return (
    <Dashboard
      status={game.status}
      channelName={game.channelName}
      extra={<GameControls />}
      preview={
        <StageFrame maxHeight={720}>
          <GameStage game={game} />
        </StageFrame>
      }
    />
  );
}
