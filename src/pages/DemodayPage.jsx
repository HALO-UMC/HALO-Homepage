import { useEffect, useRef, useState } from "react";

const YOUTUBE_VIDEO_ID = "9-VkbFe2U3U";

// 4분 12초
const CUT_AT_SECONDS = 3 * 60 + 57;

const SCENE = {
  VIDEO: "video",
  BLACKOUT: "blackout",
  TODAY: "today",
  QUESTION: "question",
  BRAND: "brand",
};

let youtubeApiPromise = null;

function loadYouTubeApi() {
  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise((resolve) => {
    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]',
    );

    const previousCallback = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousCallback === "function") {
        previousCallback();
      }

      resolve(window.YT);
    };

    if (!existingScript) {
      const script = document.createElement("script");

      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;

      document.head.appendChild(script);
    }
  });

  return youtubeApiPromise;
}

/* =====================================================
   TYPEWRITER
   여러 스타일의 텍스트를 하나의 문장처럼 순서대로 입력
===================================================== */

function TypewriterText({
  segments,
  speed = 120,
  startDelay = 0,
  showCursor = true,
  onComplete,
  className = "",
}) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);

  const totalLength = segments.reduce(
    (sum, segment) => sum + segment.text.length,
    0,
  );

  useEffect(() => {
    let interval;
    let timeout;

    setVisibleCount(0);
    setStarted(false);
    setCompleted(false);

    timeout = setTimeout(() => {
      setStarted(true);

      interval = setInterval(() => {
        setVisibleCount((prev) => {
          const next = prev + 1;

          if (next >= totalLength) {
            clearInterval(interval);

            setTimeout(() => {
              setCompleted(true);

              if (onComplete) {
                onComplete();
              }
            }, 100);

            return totalLength;
          }

          return next;
        });
      }, speed);
    }, startDelay);

    return () => {
      clearTimeout(timeout);

      if (interval) {
        clearInterval(interval);
      }
    };
  }, [segments, speed, startDelay, totalLength, onComplete]);

  let consumed = 0;

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        const start = consumed;
        const end = consumed + segment.text.length;

        const countInsideSegment = Math.max(
          0,
          Math.min(visibleCount - start, segment.text.length),
        );

        consumed = end;

        return (
          <span key={`${segment.text}-${index}`} className={segment.className}>
            {segment.text.slice(0, countInsideSegment)}
          </span>
        );
      })}

      {showCursor && started && !completed && (
        <span className="typing-cursor" />
      )}
    </span>
  );
}

function DemodayPage() {
  const playerElementRef = useRef(null);
  const playerRef = useRef(null);

  const timelineIntervalRef = useRef(null);
  const sceneTimersRef = useRef([]);

  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [scene, setScene] = useState(SCENE.VIDEO);

  const clearTimelineInterval = () => {
    if (!timelineIntervalRef.current) {
      return;
    }

    clearInterval(timelineIntervalRef.current);
    timelineIntervalRef.current = null;
  };

  const clearSceneTimers = () => {
    sceneTimersRef.current.forEach((timer) => {
      clearTimeout(timer);
    });

    sceneTimersRef.current = [];
  };

  const addSceneTimer = (callback, delay) => {
    const timer = setTimeout(callback, delay);

    sceneTimersRef.current.push(timer);
  };

  const replayVideo = () => {
    const player = playerRef.current;

    if (!player) {
      return;
    }

    clearSceneTimers();

    setScene(SCENE.VIDEO);

    player.seekTo(0, true);
    player.playVideo();
  };

  /* =====================================================
     4:12 → 타이포 시퀀스
  ===================================================== */

  const playTypographySequence = () => {
    const player = playerRef.current;

    if (!player) {
      return;
    }

    clearTimelineInterval();
    clearSceneTimers();

    player.pauseVideo();

    /*
      0.0 ~ 0.7
      완전 암전
    */

    setScene(SCENE.BLACKOUT);

    /*
      0.7 ~ 2.4

      오
      오늘
      오늘,
    */

    addSceneTimer(() => {
      setScene(SCENE.TODAY);
    }, 700);

    /*
      2.5 ~ 6.5

      부
      부모
      부모님
      부모님께...
    */

    addSceneTimer(() => {
      setScene(SCENE.QUESTION);
    }, 2500);

    /*
      질문 입력 종료 후 잠시 머물고
      HALO
    */

    addSceneTimer(() => {
      setScene(SCENE.BRAND);
    }, 7200);

    /*
      전체 루프
    */

    addSceneTimer(() => {
      replayVideo();
    }, 12000);
  };

  const startTimelineWatcher = () => {
    clearTimelineInterval();

    timelineIntervalRef.current = setInterval(() => {
      const player = playerRef.current;

      if (!player?.getCurrentTime) {
        return;
      }

      const currentTime = player.getCurrentTime();

      if (currentTime >= CUT_AT_SECONDS) {
        playTypographySequence();
      }
    }, 80);
  };

  /* =====================================================
     YOUTUBE
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    loadYouTubeApi().then((YT) => {
      if (!mounted || !playerElementRef.current) {
        return;
      }

      playerRef.current = new YT.Player(playerElementRef.current, {
        videoId: YOUTUBE_VIDEO_ID,

        width: "100%",
        height: "100%",

        playerVars: {
          autoplay: 0,
          controls: 0,

          // YouTube 자체 키보드 단축키 허용
          disablekb: 0,

          cc_load_policy: 0,

          fs: 0,
          iv_load_policy: 3,
          playsinline: 1,
          rel: 0,
        },

        events: {
          onReady: () => {
            if (!mounted) {
              return;
            }

            setIsPlayerReady(true);
          },

          onStateChange: (event) => {
            if (!mounted) {
              return;
            }

            if (event.data === YT.PlayerState.PLAYING) {
              startTimelineWatcher();
            }

            if (
              event.data === YT.PlayerState.PAUSED ||
              event.data === YT.PlayerState.ENDED
            ) {
              clearTimelineInterval();
            }
          },
        },
      });
    });

    return () => {
      mounted = false;

      clearTimelineInterval();
      clearSceneTimers();

      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
      }

      playerRef.current = null;
    };
  }, []);

  const handleStart = () => {
    const player = playerRef.current;

    if (!player || !isPlayerReady) {
      return;
    }

    setHasStarted(true);
    setScene(SCENE.VIDEO);

    player.seekTo(0, true);
    player.playVideo();
  };

  return (
    <>
      <main className="demoday">
        {/* =====================================================
            VIDEO
        ===================================================== */}

        <div
          className={`demoday-video ${
            scene === SCENE.VIDEO ? "is-visible" : ""
          }`}
        >
          <div ref={playerElementRef} className="youtube-player" />
        </div>

        {/* =====================================================
            START
        ===================================================== */}

        {!hasStarted && (
          <section className="start-screen">
            <button
              type="button"
              className="start-button"
              onClick={handleStart}
              disabled={!isPlayerReady}
            >
              {isPlayerReady ? "영상 시작" : "영상 준비 중"}
            </button>
          </section>
        )}

        {/* =====================================================
            BLACKOUT
        ===================================================== */}

        {hasStarted && scene === SCENE.BLACKOUT && (
          <section className="scene scene-blackout" />
        )}

        {/* =====================================================
            오늘,
        ===================================================== */}

        {hasStarted && scene === SCENE.TODAY && (
          <section className="scene scene-today">
            <div className="today-wrapper">
              <TypewriterText
                segments={[
                  {
                    text: "오늘,",
                    className: "today-text",
                  },
                ]}
                speed={190}
              />
            </div>
          </section>
        )}

        {/* =====================================================
            부모님께 어떤 안녕을 건네셨나요?
        ===================================================== */}

        {hasStarted && scene === SCENE.QUESTION && (
          <section className="scene scene-question">
            <div className="question-wrapper">
              <div className="question-line">
                <TypewriterText
                  segments={[
                    {
                      text: "부모님께 어떤 ",
                      className: "question-normal",
                    },
                    {
                      text: "안녕",
                      className: "question-hello",
                    },
                    {
                      text: "을 건네셨나요?",
                      className: "question-normal",
                    },
                  ]}
                  speed={135}
                />
              </div>
            </div>
          </section>
        )}

        {/* =====================================================
            HALO
        ===================================================== */}

        {hasStarted && scene === SCENE.BRAND && (
          <section className="scene scene-brand">
            <div className="brand-content">
              <div className="halo-logo">
                <TypewriterText
                  segments={[
                    {
                      text: "HALO",
                      className: "halo-logo-text",
                    },
                  ]}
                  speed={230}
                />
              </div>

              <div className="brand-divider" />

              <p className="brand-caption">
                매일 한 장,
                <br />
                부모님과 이어가는 따뜻한 안녕
              </p>
            </div>
          </section>
        )}
      </main>

      <style>{`
        @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css");

        * {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;

          overflow: hidden;

          background: #000;
        }

        body {
          font-family:
            "Pretendard Variable",
            Pretendard,
            -apple-system,
            BlinkMacSystemFont,
            system-ui,
            sans-serif;
        }

        button {
          font: inherit;
        }

        /* =====================================================
           BASE
        ===================================================== */

        .demoday {
          position: relative;

          width: 100vw;
          height: 100vh;

          overflow: hidden;

          background: #000;
          color: #f8f8f6;
        }

        /* =====================================================
           VIDEO
        ===================================================== */

        .demoday-video {
          position: absolute;
          inset: 0;

          z-index: 1;

          opacity: 0;

          pointer-events: none;

          transition: opacity 350ms ease;
        }

        .demoday-video.is-visible {
          opacity: 1;

          pointer-events: auto;
        }

        .youtube-player,
        .youtube-player iframe {
          width: 100%;
          height: 100%;

          border: 0;
        }

        /* =====================================================
           START
        ===================================================== */

        .start-screen {
          position: absolute;
          inset: 0;

          z-index: 100;

          display: flex;
          align-items: center;
          justify-content: center;

          background: #000;
        }

        .start-button {
          padding: 15px 28px;

          border: 0;
          border-radius: 100px;

          background: #fff;
          color: #080808;

          font-size: 15px;
          font-weight: 650;

          letter-spacing: -0.035em;

          cursor: pointer;

          transition: transform 200ms ease;
        }

        .start-button:hover:not(:disabled) {
          transform: scale(1.035);
        }

        .start-button:disabled {
          opacity: 0.3;

          cursor: default;
        }

        /* =====================================================
           COMMON SCENE
        ===================================================== */

        .scene {
          position: absolute;
          inset: 0;

          z-index: 50;

          background: #000;

          overflow: hidden;
        }

        /* =====================================================
           BLACKOUT
        ===================================================== */

        .scene-blackout {
          background: #000;
        }

        /* =====================================================
           CURSOR
        ===================================================== */

        .typing-cursor {
          display: inline-block;

          width: 0.055em;
          height: 0.92em;

          margin-left: 0.08em;

          vertical-align: -0.07em;

          background: currentColor;

          animation: cursorBlink 750ms steps(1) infinite;
        }

        @keyframes cursorBlink {
          0%,
          45% {
            opacity: 1;
          }

          46%,
          100% {
            opacity: 0;
          }
        }

        /* =====================================================
           TODAY
        ===================================================== */

        .scene-today {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .today-wrapper {
          transform: translateY(-1vh);
        }

        .today-text {
          font-size: clamp(48px, 4.6vw, 86px);

          font-weight: 420;

          line-height: 1;

          letter-spacing: -0.07em;

          color: rgba(248, 248, 246, 0.82);
        }

        /* =====================================================
           QUESTION
        ===================================================== */

        .scene-question {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .question-wrapper {
          width: min(88vw, 1650px);

          text-align: center;
        }

        .question-line {
          min-height: 1.3em;

          font-size: clamp(58px, 6.6vw, 126px);

          font-weight: 600;

          line-height: 1.18;

          letter-spacing: -0.072em;

          word-break: keep-all;

          color: #f8f8f6;
        }

        .question-normal {
          color: #f8f8f6;
        }

        .question-hello {
          color: #ff7b10;

          font-weight: 760;
        }

        /* =====================================================
           BRAND
        ===================================================== */

        .scene-brand {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brand-content {
          display: flex;
          flex-direction: column;
          align-items: center;

          text-align: center;
        }

        .halo-logo {
          min-height: 0.9em;

          font-size: clamp(108px, 12vw, 220px);

          font-weight: 800;

          line-height: 0.9;

          letter-spacing: -0.085em;

          color: #fafaf8;
        }

        .halo-logo-text {
          color: #fafaf8;
        }

        .brand-divider {
          width: 1px;
          height: 62px;

          margin: 44px 0 32px;

          transform-origin: top;

          background: linear-gradient(
            to bottom,
            transparent,
            rgba(255, 123, 16, 0.95),
            transparent
          );

          animation: dividerAppear 900ms 900ms both;
        }

        .brand-caption {
          margin: 0;

          opacity: 0;

          font-size: clamp(21px, 1.9vw, 34px);

          font-weight: 420;

          line-height: 1.5;

          letter-spacing: -0.045em;

          color: rgba(248, 248, 246, 0.52);

          animation: captionAppear 1.1s 1.4s forwards;
        }

        @keyframes dividerAppear {
          from {
            opacity: 0;

            transform: scaleY(0);
          }

          to {
            opacity: 1;

            transform: scaleY(1);
          }
        }

        @keyframes captionAppear {
          from {
            opacity: 0;

            transform: translateY(8px);
          }

          to {
            opacity: 1;

            transform: translateY(0);
          }
        }

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 768px) {
          .question-wrapper {
            width: 88vw;
          }

          .question-line {
            font-size: clamp(42px, 9vw, 70px);

            line-height: 1.28;
          }
        }
      `}</style>
    </>
  );
}

export default DemodayPage;
