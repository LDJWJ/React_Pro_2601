import { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import './Editor.css';

// 샘플 BGM 목록 (초 단위 duration 추가)
const bgmList = [
  { id: 1, name: 'Happy Cat', duration: '2:30', durationSec: 150 },
  { id: 2, name: 'Sunny Day', duration: '3:15', durationSec: 195 },
  { id: 3, name: 'Chill Vibes', duration: '2:45', durationSec: 165 },
  { id: 4, name: 'Epic Adventure', duration: '4:00', durationSec: 240 },
  { id: 5, name: 'Peaceful Morning', duration: '3:30', durationSec: 210 },
];

// 기본 타임라인 길이 (초)
const DEFAULT_TIMELINE_DURATION = 60;

function Editor({ onBack }) {
  // 미디어 상태
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState(null);
  const [mediaType, setMediaType] = useState(null); // 'video' or 'image'
  const [mediaDuration, setMediaDuration] = useState(0); // 미디어 길이

  // 재생 상태
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // 선택된 타임라인 위치
  const [selectedTime, setSelectedTime] = useState(0);

  // 텍스트 오버레이 (시간 정보 포함)
  const [textOverlays, setTextOverlays] = useState([]);
  const [editingTextId, setEditingTextId] = useState(null);

  // 자막
  const [subtitles, setSubtitles] = useState([]);
  const [showSubtitleModal, setShowSubtitleModal] = useState(false);
  const [subtitleText, setSubtitleText] = useState('');
  const [subtitleStart, setSubtitleStart] = useState(0);
  const [subtitleEnd, setSubtitleEnd] = useState(2);

  // 음악
  const [selectedBgm, setSelectedBgm] = useState(null);
  const [showMusicPanel, setShowMusicPanel] = useState(false);
  const [bgmVolume, setBgmVolume] = useState(0.5);

  // 음성 녹음
  const [isRecording, setIsRecording] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceRecordings, setVoiceRecordings] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);

  // 활성 탭
  const [activeTab, setActiveTab] = useState('media');

  // 내보내기 상태
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  const ffmpegRef = useRef(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);

  // Refs
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const mediaInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const chunksRef = useRef([]);
  const timelineRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  // 전체 타임라인 길이 계산 (미디어, 음악, 자막 중 가장 긴 것)
  const getTimelineDuration = () => {
    let maxDuration = DEFAULT_TIMELINE_DURATION;

    if (mediaDuration > 0) {
      maxDuration = Math.max(maxDuration, mediaDuration);
    }

    if (selectedBgm) {
      maxDuration = Math.max(maxDuration, selectedBgm.durationSec);
    }

    subtitles.forEach(sub => {
      maxDuration = Math.max(maxDuration, sub.endTime);
    });

    textOverlays.forEach(text => {
      if (text.endTime) {
        maxDuration = Math.max(maxDuration, text.endTime);
      }
    });

    voiceRecordings.forEach(rec => {
      if (rec.startTime !== undefined && rec.duration) {
        maxDuration = Math.max(maxDuration, rec.startTime + rec.duration);
      }
    });

    return maxDuration;
  };

  const timelineDuration = getTimelineDuration();

  // 공통 텍스트 렌더링 함수 (미리보기 & 내보내기 동일하게 사용)
  const drawTextOnCanvas = (ctx, canvasWidth, canvasHeight, time) => {
    const visibleTexts = textOverlays.filter(t => time >= t.startTime && time <= t.endTime);

    visibleTexts.forEach(overlay => {
      ctx.save();

      // 폰트 크기: Canvas 높이 대비 비율로 계산
      const fontSize = overlay.fontSize * (canvasHeight / 320);

      ctx.font = `${overlay.fontWeight} ${fontSize}px "Noto Sans KR", "Malgun Gothic", sans-serif`;
      ctx.fillStyle = overlay.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 텍스트 그림자
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      // 위치 계산 (% -> 픽셀)
      const x = (overlay.x / 100) * canvasWidth;
      const y = (overlay.y / 100) * canvasHeight;

      ctx.fillText(overlay.text, x, y);
      ctx.restore();
    });
  };

  // Canvas 미리보기 업데이트
  const updatePreviewCanvas = () => {
    const canvas = previewCanvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video || !mediaUrl || mediaType !== 'video') return;

    const ctx = canvas.getContext('2d');

    // Canvas 크기를 비디오 실제 크기에 맞춤
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
    }

    // 비디오 프레임 그리기
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 텍스트 오버레이 그리기
    drawTextOnCanvas(ctx, canvas.width, canvas.height, video.currentTime);
  };

  // 미리보기 애니메이션 루프
  useEffect(() => {
    const animate = () => {
      updatePreviewCanvas();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (mediaUrl && mediaType === 'video') {
      animate();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mediaUrl, mediaType, textOverlays, currentTime]);

  // 미디어 파일 선택 처리
  const handleMediaSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMediaFile(file);
      setMediaUrl(url);
      setMediaType(file.type.startsWith('video') ? 'video' : 'image');
      setCurrentTime(0);
      setIsPlaying(false);

      // 이미지인 경우 기본 10초 설정
      if (!file.type.startsWith('video')) {
        setMediaDuration(10);
      }
    }
  };

  // 재생/일시정지
  const handlePlayPause = () => {
    if (!mediaUrl || mediaType !== 'video') return;

    if (isPlaying) {
      videoRef.current?.pause();
      audioRef.current?.pause();
    } else {
      videoRef.current?.play();
      if (selectedBgm) {
        audioRef.current?.play();
      }
    }
    setIsPlaying(!isPlaying);
  };

  // 비디오 시간 업데이트
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setSelectedTime(videoRef.current.currentTime);
    }
  };

  // 비디오 메타데이터 로드
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setMediaDuration(videoRef.current.duration);
    }
  };

  // 타임라인 클릭으로 위치 선택
  const handleTimelineClick = (e) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * timelineDuration;

    setSelectedTime(Math.max(0, Math.min(newTime, timelineDuration)));
    setCurrentTime(Math.max(0, Math.min(newTime, timelineDuration)));

    // 비디오가 있으면 해당 위치로 이동
    if (videoRef.current && mediaType === 'video') {
      videoRef.current.currentTime = Math.min(newTime, mediaDuration);
    }
  };

  // 텍스트 추가 (현재 선택된 위치에서 2초 길이)
  const handleAddText = () => {
    const startTime = selectedTime;
    const endTime = startTime + 2; // 기본 2초

    const newText = {
      id: Date.now(),
      text: '텍스트를 입력하세요',
      x: 50,
      y: 50,
      fontSize: 14,
      color: '#ffffff',
      fontWeight: 'bold',
      startTime: startTime,
      endTime: endTime,
    };
    setTextOverlays([...textOverlays, newText]);
    setEditingTextId(newText.id);
    setActiveTab('text');
  };

  // 텍스트 수정
  const handleTextChange = (id, newText) => {
    setTextOverlays(textOverlays.map(t =>
      t.id === id ? { ...t, text: newText } : t
    ));
  };

  // 텍스트 삭제
  const handleTextDelete = (id) => {
    setTextOverlays(textOverlays.filter(t => t.id !== id));
    setEditingTextId(null);
  };

  // 텍스트 드래그
  const handleTextDrag = (id, e) => {
    const preview = e.target.closest('.preview-area');
    if (!preview) return;

    const rect = preview.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setTextOverlays(textOverlays.map(t =>
      t.id === id ? { ...t, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } : t
    ));
  };

  // 텍스트 방향 이동 (현재 위치에서 조금씩 이동)
  const handleTextPosition = (direction) => {
    if (!editingTextId) return;

    const step = 3; // 약 10px 정도 (화면 크기 대비 %)

    const directions = {
      'top-left': { x: -step, y: -step },
      'top-center': { x: 0, y: -step },
      'top-right': { x: step, y: -step },
      'middle-left': { x: -step, y: 0 },
      'middle-center': { x: 0, y: 0 }, // 중앙으로 리셋
      'middle-right': { x: step, y: 0 },
      'bottom-left': { x: -step, y: step },
      'bottom-center': { x: 0, y: step },
      'bottom-right': { x: step, y: step },
    };

    const delta = directions[direction];
    if (delta) {
      setTextOverlays(textOverlays.map(t => {
        if (t.id === editingTextId) {
          // 중앙 버튼은 정중앙(50, 50)으로 리셋
          if (direction === 'middle-center') {
            return { ...t, x: 50, y: 50 };
          }
          // 그 외는 현재 위치에서 이동
          const newX = Math.max(5, Math.min(95, t.x + delta.x));
          const newY = Math.max(5, Math.min(95, t.y + delta.y));
          return { ...t, x: newX, y: newY };
        }
        return t;
      }));
    }
  };

  // 텍스트 크기 조절
  const handleTextSize = (newSize) => {
    if (!editingTextId) return;

    setTextOverlays(textOverlays.map(t =>
      t.id === editingTextId ? { ...t, fontSize: newSize } : t
    ));
  };

  // 현재 편집 중인 텍스트 정보 가져오기
  const getEditingText = () => {
    return textOverlays.find(t => t.id === editingTextId);
  };

  // 자막 모달 열기 (현재 선택된 위치로 시작/종료 시간 설정)
  const openSubtitleModal = () => {
    setSubtitleStart(Math.floor(selectedTime));
    setSubtitleEnd(Math.floor(selectedTime) + 2); // 기본 2초
    setShowSubtitleModal(true);
  };

  // 자막 추가
  const handleAddSubtitle = () => {
    if (!subtitleText.trim()) return;

    const newSubtitle = {
      id: Date.now(),
      text: subtitleText,
      startTime: subtitleStart,
      endTime: subtitleEnd,
    };
    setSubtitles([...subtitles, newSubtitle]);
    setSubtitleText('');
    setSubtitleStart(subtitleEnd);
    setSubtitleEnd(subtitleEnd + 2);
    setShowSubtitleModal(false);
  };

  // 자막 삭제
  const handleSubtitleDelete = (id) => {
    setSubtitles(subtitles.filter(s => s.id !== id));
  };

  // 현재 시간에 해당하는 자막 찾기
  const getCurrentSubtitle = () => {
    return subtitles.find(s =>
      currentTime >= s.startTime && currentTime <= s.endTime
    );
  };

  // 현재 시간에 표시할 텍스트 오버레이 필터
  const getVisibleTextOverlays = () => {
    return textOverlays.filter(t =>
      currentTime >= t.startTime && currentTime <= t.endTime
    );
  };

  // BGM 선택
  const handleBgmSelect = (bgm) => {
    setSelectedBgm(bgm);
    setShowMusicPanel(false);
  };

  // BGM 제거
  const handleBgmRemove = () => {
    setSelectedBgm(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // FFmpeg 로드
  const loadFFmpeg = async () => {
    if (ffmpegRef.current) return ffmpegRef.current;

    const ffmpeg = new FFmpeg();

    ffmpeg.on('progress', ({ progress }) => {
      setExportProgress(Math.round(progress * 100));
    });

    ffmpeg.on('log', ({ message }) => {
      console.log('FFmpeg:', message);
    });

    setExportStatus('FFmpeg 로딩 중...');

    // CDN에서 FFmpeg core 로드
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    ffmpegRef.current = ffmpeg;
    setFfmpegLoaded(true);
    return ffmpeg;
  };

  // 내보내기 실행
  const handleExport = async () => {
    if (!mediaFile) {
      alert('내보낼 미디어 파일이 없습니다.');
      return;
    }

    try {
      setIsExporting(true);
      setExportProgress(0);

      const ffmpeg = await loadFFmpeg();

      setExportStatus('파일 준비 중...');

      // 입력 파일 확장자 추출
      const fileExt = mediaFile.name.split('.').pop().toLowerCase();
      const inputFileName = mediaType === 'video' ? `input.${fileExt}` : `input.${fileExt}`;

      // 입력 파일 쓰기
      const fileData = await fetchFile(mediaFile);
      await ffmpeg.writeFile(inputFileName, fileData);
      console.log('입력 파일 작성 완료:', inputFileName, fileData.length, 'bytes');

      // 출력 파일명
      const outputFileName = 'output.mp4';

      // FFmpeg 명령어 구성
      let command = [];

      if (mediaType === 'video') {
        command = ['-i', inputFileName];
      } else {
        // 이미지인 경우 루프하여 비디오로 변환
        command = [
          '-loop', '1',
          '-i', inputFileName,
          '-t', String(mediaDuration || 10),
          '-pix_fmt', 'yuv420p'
        ];
      }

      // 출력 옵션 (텍스트 오버레이는 Canvas 방식으로 별도 처리 필요 - 폰트 문제)
      // 기본 영상만 먼저 내보내기
      command.push(
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '28',
        '-pix_fmt', 'yuv420p'
      );

      // 비디오인 경우 오디오 처리
      if (mediaType === 'video') {
        command.push('-c:a', 'aac', '-b:a', '128k');
      } else {
        // 이미지인 경우 무음 오디오 추가하지 않음
        command.push('-an');
      }

      command.push(
        '-movflags', '+faststart',
        '-y',
        outputFileName
      );

      setExportStatus('영상 인코딩 중...');
      console.log('FFmpeg command:', command.join(' '));

      // FFmpeg 실행
      const result = await ffmpeg.exec(command);
      console.log('FFmpeg 실행 결과:', result);

      setExportStatus('파일 생성 중...');

      // 출력 파일 확인
      try {
        const data = await ffmpeg.readFile(outputFileName);
        console.log('출력 파일 크기:', data.length, 'bytes');

        if (data.length === 0) {
          throw new Error('출력 파일이 비어 있습니다. 입력 파일 형식을 확인해주세요.');
        }

        // 다운로드
        const blob = new Blob([data.buffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hookhook_export_${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setExportStatus('완료!');

        // 텍스트 오버레이 안내
        if (textOverlays.length > 0) {
          setTimeout(() => {
            alert('참고: 텍스트 오버레이는 현재 버전에서 미리보기에만 표시됩니다.\n(FFmpeg.wasm 폰트 제한)');
          }, 500);
        }

      } catch (readError) {
        console.error('파일 읽기 오류:', readError);
        throw new Error('출력 파일을 읽을 수 없습니다: ' + readError.message);
      }

      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        setExportStatus('');
      }, 2000);

    } catch (error) {
      console.error('내보내기 오류:', error);
      alert('내보내기 중 오류가 발생했습니다:\n' + error.message + '\n\n콘솔(F12)에서 상세 로그를 확인하세요.');
      setIsExporting(false);
      setExportProgress(0);
      setExportStatus('');
    }
  };

  // Canvas 기반 내보내기 (텍스트 오버레이 포함)
  const handleCanvasExport = async () => {
    if (!mediaFile || !videoRef.current) {
      alert('내보낼 영상 파일이 없습니다.');
      return;
    }

    if (mediaType !== 'video') {
      alert('Canvas 내보내기는 영상 파일만 지원합니다.');
      return;
    }

    try {
      setIsExporting(true);
      setExportProgress(0);
      setExportStatus('녹화 준비 중...');

      const video = videoRef.current;
      const duration = video.duration;

      // Canvas 생성
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');

      // MediaRecorder 설정
      const stream = canvas.captureStream(30); // 30fps

      // 오디오 트랙 추가 (원본 영상의 오디오)
      if (video.captureStream) {
        const videoStream = video.captureStream();
        const audioTracks = videoStream.getAudioTracks();
        audioTracks.forEach(track => stream.addTrack(track));
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 5000000,
      });

      const chunks = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      // 녹화 완료 시 다운로드
      mediaRecorder.onstop = () => {
        setExportStatus('파일 생성 중...');
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hookhook_export_${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setExportStatus('완료!');
        setTimeout(() => {
          setIsExporting(false);
          setExportProgress(0);
          setExportStatus('');
        }, 2000);
      };

      // 프레임 그리기 (공통 함수 사용)
      const drawFrame = () => {
        // 비디오 프레임 그리기
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // 텍스트 오버레이 그리기 (공통 함수 사용)
        drawTextOnCanvas(ctx, canvas.width, canvas.height, video.currentTime);
      };

      // 녹화 시작
      setExportStatus('녹화 중... (영상 재생)');
      mediaRecorder.start(100);

      // 비디오 처음으로 이동
      video.currentTime = 0;
      video.muted = true; // 녹화 중 음소거

      // 프레임 업데이트 루프
      let animationId;
      const updateFrame = () => {
        if (video.ended || video.currentTime >= duration) {
          cancelAnimationFrame(animationId);
          mediaRecorder.stop();
          video.muted = false;
          video.pause();
          return;
        }

        drawFrame();
        setExportProgress(Math.round((video.currentTime / duration) * 100));
        animationId = requestAnimationFrame(updateFrame);
      };

      // 비디오 재생 시작
      video.play().then(() => {
        updateFrame();
      }).catch(err => {
        console.error('비디오 재생 오류:', err);
        setIsExporting(false);
        alert('비디오 재생에 실패했습니다.');
      });

    } catch (error) {
      console.error('Canvas 내보내기 오류:', error);
      alert('내보내기 중 오류가 발생했습니다: ' + error.message);
      setIsExporting(false);
      setExportProgress(0);
      setExportStatus('');
    }
  };

  // 내보내기 방식 선택
  const [showExportOptions, setShowExportOptions] = useState(false);

  // 음성 녹음 시작
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const newRecording = {
          id: Date.now(),
          url,
          duration: recordingTime,
          name: `녹음 ${voiceRecordings.length + 1}`,
          startTime: selectedTime, // 현재 선택된 위치에서 시작
        };
        setVoiceRecordings([...voiceRecordings, newRecording]);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('마이크 접근 오류:', err);
      alert('마이크 접근 권한이 필요합니다.');
    }
  };

  // 음성 녹음 중지
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    }
  };

  // 녹음 삭제
  const handleRecordingDelete = (id) => {
    setVoiceRecordings(voiceRecordings.filter(r => r.id !== id));
  };

  // 시간 포맷팅
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 툴바 버튼 클릭
  const handleToolClick = (tool) => {
    setActiveTab(tool);

    switch (tool) {
      case 'media':
        mediaInputRef.current?.click();
        break;
      case 'music':
        setShowMusicPanel(true);
        break;
      case 'voice':
        setShowVoiceModal(true);
        break;
      case 'text':
        handleAddText();
        break;
      default:
        break;
    }
  };

  // 타임라인 눈금 생성
  const generateTimelineMarkers = () => {
    const markers = [];
    const interval = timelineDuration <= 60 ? 10 :
                     timelineDuration <= 120 ? 20 :
                     timelineDuration <= 300 ? 30 : 60;

    for (let i = 0; i <= timelineDuration; i += interval) {
      markers.push(i);
    }
    return markers;
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (mediaUrl) URL.revokeObjectURL(mediaUrl);
      voiceRecordings.forEach(r => URL.revokeObjectURL(r.url));
      clearInterval(recordingIntervalRef.current);
    };
  }, []);

  const currentSubtitle = getCurrentSubtitle();
  const visibleTextOverlays = getVisibleTextOverlays();
  const timelineMarkers = generateTimelineMarkers();

  return (
    <div className="editor-container">
      {/* 숨겨진 파일 입력 */}
      <input
        ref={mediaInputRef}
        type="file"
        accept="video/*,image/*"
        onChange={handleMediaSelect}
        style={{ display: 'none' }}
      />

      {/* 숨겨진 오디오 (BGM용) */}
      {selectedBgm && (
        <audio
          ref={audioRef}
          src={`/bgm/${selectedBgm.id}.mp3`}
          loop
          volume={bgmVolume}
        />
      )}

      {/* 상단 헤더 */}
      <header className="editor-header">
        <button className="back-button" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span>새 프로젝트</span>
        </button>
        <div className="header-actions">
          <button className="icon-button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 10h4l3-7 4 14 3-7h4" />
            </svg>
          </button>
          <button className="icon-button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10h-4l-3-7-4 14-3-7H3" />
            </svg>
          </button>
          <button className="export-button" onClick={() => setShowExportOptions(true)} disabled={isExporting || !mediaFile}>
            {isExporting ? '처리 중...' : '내보내기'}
          </button>
        </div>
      </header>

      {/* 영상 미리보기 영역 */}
      <div className="preview-area">
        <div className="preview-content">
          {!mediaUrl ? (
            <div className="preview-placeholder" onClick={() => mediaInputRef.current?.click()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="20" height="20" rx="2" />
                <circle cx="8" cy="8" r="2" />
                <path d="M21 15l-5-5-5 5" />
                <path d="M14 21l-7-7-5 5" />
              </svg>
              <p>미디어를 추가하세요</p>
              <span>탭하여 영상 또는 이미지 선택</span>
            </div>
          ) : mediaType === 'video' ? (
            <>
              {/* 비디오 (숨김 - Canvas가 대신 표시) */}
              <video
                ref={videoRef}
                src={mediaUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                className="preview-video hidden-video"
              />
              {/* Canvas 미리보기 (비디오 + 텍스트) */}
              <canvas
                ref={previewCanvasRef}
                className="preview-canvas"
              />
            </>
          ) : (
            <img src={mediaUrl} alt="Preview" className="preview-image" />
          )}

          {/* 텍스트 편집용 오버레이 (편집 중이거나 클릭 가능한 상태) */}
          {visibleTextOverlays.map((overlay) => (
            <div
              key={overlay.id}
              className={`text-overlay-edit ${editingTextId === overlay.id ? 'editing' : ''}`}
              style={{
                left: `${overlay.x}%`,
                top: `${overlay.y}%`,
              }}
              draggable
              onDragEnd={(e) => handleTextDrag(overlay.id, e)}
              onClick={() => setEditingTextId(overlay.id)}
            >
              {editingTextId === overlay.id ? (
                <input
                  type="text"
                  value={overlay.text}
                  onChange={(e) => handleTextChange(overlay.id, e.target.value)}
                  onBlur={() => setEditingTextId(null)}
                  autoFocus
                  className="text-input"
                  style={{ fontSize: `${overlay.fontSize}px` }}
                />
              ) : (
                <span className="text-edit-handle" style={{ fontSize: `${overlay.fontSize * 0.8}px` }}>
                  {overlay.text}
                </span>
              )}
              {editingTextId === overlay.id && (
                <button
                  className="text-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTextDelete(overlay.id);
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}

          {/* 자막 표시 */}
          {currentSubtitle && (
            <div className="subtitle-display">
              {currentSubtitle.text}
            </div>
          )}
        </div>
      </div>

      {/* 텍스트 위치 조절 패널 */}
      {editingTextId && (
        <div className="text-position-panel">
          <span className="position-label">위치</span>
          <div className="position-grid">
            <button
              className="position-btn"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleTextPosition('top-left')}
              title="왼쪽 상단"
            >↖</button>
            <button
              className="position-btn"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleTextPosition('top-center')}
              title="중앙 상단"
            >↑</button>
            <button
              className="position-btn"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleTextPosition('top-right')}
              title="오른쪽 상단"
            >↗</button>
            <button
              className="position-btn"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleTextPosition('middle-left')}
              title="왼쪽 중앙"
            >←</button>
            <button
              className="position-btn center"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleTextPosition('middle-center')}
              title="정중앙"
            >●</button>
            <button
              className="position-btn"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleTextPosition('middle-right')}
              title="오른쪽 중앙"
            >→</button>
            <button
              className="position-btn"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleTextPosition('bottom-left')}
              title="왼쪽 하단"
            >↙</button>
            <button
              className="position-btn"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleTextPosition('bottom-center')}
              title="중앙 하단"
            >↓</button>
            <button
              className="position-btn"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleTextPosition('bottom-right')}
              title="오른쪽 하단"
            >↘</button>
          </div>
          <div className="size-control">
            <span className="size-label">크기</span>
            <button
              className="size-btn"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleTextSize(Math.max(12, (getEditingText()?.fontSize || 24) - 2))}
            >−</button>
            <span className="size-value">{getEditingText()?.fontSize || 24}px</span>
            <button
              className="size-btn"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleTextSize(Math.min(72, (getEditingText()?.fontSize || 24) + 2))}
            >+</button>
          </div>
          <span className="position-hint">드래그로 미세 조정 가능</span>
        </div>
      )}

      {/* 재생 컨트롤 */}
      <div className="playback-controls">
        <div className="time-info">
          <span className="time-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6v6l4 2" fill="none" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </span>
          <span className="time-text">{formatTime(currentTime)}</span>
          <span className="duration-text">/ {formatTime(timelineDuration)}</span>
        </div>
        <div className="time-hint">
          빨간 부분을 선택하면 지정 위치가 선택되도록
        </div>
        <div className="play-buttons">
          <button className="play-button" onClick={handlePlayPause} disabled={!mediaUrl || mediaType !== 'video'}>
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 타임라인 */}
      <div
        className="timeline-container"
        ref={timelineRef}
        onClick={handleTimelineClick}
      >
        {/* 타임라인 눈금 */}
        <div className="timeline-ruler">
          {timelineMarkers.map((time, idx) => (
            <span
              key={idx}
              style={{ left: `${(time / timelineDuration) * 100}%` }}
            >
              {formatTime(time)}
            </span>
          ))}
        </div>

        {/* 재생 헤드 (현재 위치) */}
        <div
          className="timeline-playhead"
          style={{ left: `${(selectedTime / timelineDuration) * 100}%` }}
        />

        {/* 미디어 트랙 */}
        {mediaUrl && (
          <div className="timeline-track media-track">
            <span className="track-label">미디어</span>
            <div
              className="track-content"
              style={{ width: `${(mediaDuration / timelineDuration) * 100}%` }}
            />
          </div>
        )}

        {/* 자막 트랙 */}
        <div className="timeline-track subtitle-track">
          <span className="track-label">자막</span>
          {subtitles.map((sub) => (
            <div
              key={sub.id}
              className="track-item subtitle-item-track"
              style={{
                left: `${(sub.startTime / timelineDuration) * 100}%`,
                width: `${((sub.endTime - sub.startTime) / timelineDuration) * 100}%`,
              }}
              title={sub.text}
            />
          ))}
          {/* 텍스트 오버레이도 자막 트랙에 표시 */}
          {textOverlays.map((text) => (
            <div
              key={`text-${text.id}`}
              className="track-item text-item-track"
              style={{
                left: `${(text.startTime / timelineDuration) * 100}%`,
                width: `${((text.endTime - text.startTime) / timelineDuration) * 100}%`,
              }}
              title={text.text}
            />
          ))}
        </div>

        {/* 음악 트랙 */}
        {selectedBgm && (
          <div className="timeline-track music-track">
            <span className="track-label">음악</span>
            <div
              className="track-content"
              style={{ width: `${(selectedBgm.durationSec / timelineDuration) * 100}%` }}
            />
          </div>
        )}

        {/* 음성 트랙 */}
        {voiceRecordings.length > 0 && (
          <div className="timeline-track voice-track">
            <span className="track-label">음성</span>
            {voiceRecordings.map((rec) => (
              <div
                key={rec.id}
                className="track-item"
                style={{
                  left: `${((rec.startTime || 0) / timelineDuration) * 100}%`,
                  width: `${(rec.duration / timelineDuration) * 100}%`,
                }}
                title={rec.name}
              />
            ))}
          </div>
        )}
      </div>


      {/* 녹음 목록 */}
      {voiceRecordings.length > 0 && (
        <div className="voice-recordings-section">
          {voiceRecordings.map((rec) => (
            <div key={rec.id} className="voice-recording-item">
              <span className="recording-icon">🎤</span>
              <span className="recording-name">{rec.name}</span>
              <span className="recording-duration">{formatTime(rec.duration)}</span>
              <span className="recording-start">@ {formatTime(rec.startTime || 0)}</span>
              <button className="recording-delete" onClick={() => handleRecordingDelete(rec.id)}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* 하단 툴바 */}
      <div className="editor-toolbar">
        <button className="toolbar-arrow left">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <button
          className={`toolbar-item ${activeTab === 'media' ? 'active' : ''}`}
          onClick={() => handleToolClick('media')}
        >
          <svg className="toolbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <span className="toolbar-label">미디어</span>
        </button>

        <button
          className={`toolbar-item ${activeTab === 'music' ? 'active' : ''}`}
          onClick={() => handleToolClick('music')}
        >
          <svg className="toolbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <span className="toolbar-label">음악(BGM)</span>
        </button>

        <button
          className={`toolbar-item ${activeTab === 'voice' ? 'active' : ''}`}
          onClick={() => handleToolClick('voice')}
        >
          <svg className="toolbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
          <span className="toolbar-label">음성(녹음)</span>
        </button>

        <button
          className={`toolbar-item ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => handleToolClick('text')}
        >
          <svg className="toolbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7V4h16v3" />
            <line x1="12" y1="4" x2="12" y2="20" />
            <line x1="8" y1="20" x2="16" y2="20" />
          </svg>
          <span className="toolbar-label">텍스트</span>
        </button>

        <button className="toolbar-arrow right">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      {/* 음악 선택 패널 */}
      {showMusicPanel && (
        <div className="modal-overlay" onClick={() => setShowMusicPanel(false)}>
          <div className="modal-content music-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>배경 음악 선택</h3>
              <button className="modal-close" onClick={() => setShowMusicPanel(false)}>×</button>
            </div>
            <div className="bgm-list">
              {bgmList.map((bgm) => (
                <div
                  key={bgm.id}
                  className={`bgm-item ${selectedBgm?.id === bgm.id ? 'selected' : ''}`}
                  onClick={() => handleBgmSelect(bgm)}
                >
                  <span className="bgm-icon">🎵</span>
                  <span className="bgm-name">{bgm.name}</span>
                  <span className="bgm-duration">{bgm.duration}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 음성 녹음 모달 */}
      {showVoiceModal && (
        <div className="modal-overlay" onClick={() => !isRecording && setShowVoiceModal(false)}>
          <div className="modal-content voice-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>음성 녹음</h3>
              <button
                className="modal-close"
                onClick={() => !isRecording && setShowVoiceModal(false)}
                disabled={isRecording}
              >×</button>
            </div>
            <div className="voice-recorder">
              <p className="recording-position">시작 위치: {formatTime(selectedTime)}</p>
              <div className={`recording-indicator ${isRecording ? 'active' : ''}`}>
                <span className="rec-dot"></span>
                <span className="rec-time">{formatTime(recordingTime)}</span>
              </div>
              <div className="recording-controls">
                {!isRecording ? (
                  <button className="rec-start-btn" onClick={startRecording}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    <span>녹음 시작</span>
                  </button>
                ) : (
                  <button className="rec-stop-btn" onClick={stopRecording}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="6" width="12" height="12" />
                    </svg>
                    <span>녹음 중지</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 자막 추가 모달 */}
      {showSubtitleModal && (
        <div className="modal-overlay" onClick={() => setShowSubtitleModal(false)}>
          <div className="modal-content subtitle-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>자막 추가</h3>
              <button className="modal-close" onClick={() => setShowSubtitleModal(false)}>×</button>
            </div>
            <div className="subtitle-form">
              <div className="form-group">
                <label>자막 텍스트</label>
                <textarea
                  value={subtitleText}
                  onChange={(e) => setSubtitleText(e.target.value)}
                  placeholder="자막 내용을 입력하세요"
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>시작 시간 (초)</label>
                  <input
                    type="number"
                    value={subtitleStart}
                    onChange={(e) => setSubtitleStart(Number(e.target.value))}
                    min={0}
                  />
                </div>
                <div className="form-group">
                  <label>종료 시간 (초)</label>
                  <input
                    type="number"
                    value={subtitleEnd}
                    onChange={(e) => setSubtitleEnd(Number(e.target.value))}
                    min={subtitleStart + 1}
                  />
                </div>
              </div>
              <p className="form-hint">선택된 위치에서 기본 2초 길이로 추가됩니다</p>
              <button className="submit-btn" onClick={handleAddSubtitle}>
                자막 추가
              </button>
            </div>

            {/* 자막 목록 */}
            {subtitles.length > 0 && (
              <div className="subtitle-list">
                <h4>추가된 자막</h4>
                {subtitles.map((sub) => (
                  <div key={sub.id} className="subtitle-item">
                    <span className="subtitle-time">{formatTime(sub.startTime)} - {formatTime(sub.endTime)}</span>
                    <span className="subtitle-text">{sub.text}</span>
                    <button className="subtitle-delete" onClick={() => handleSubtitleDelete(sub.id)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 내보내기 옵션 모달 */}
      {showExportOptions && (
        <div className="modal-overlay" onClick={() => setShowExportOptions(false)}>
          <div className="modal-content export-options-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>내보내기 방식 선택</h3>
              <button className="modal-close" onClick={() => setShowExportOptions(false)}>×</button>
            </div>
            <div className="export-options-list">
              <button
                className="export-option-item"
                onClick={() => {
                  setShowExportOptions(false);
                  handleCanvasExport();
                }}
              >
                <div className="export-option-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 9h6v6H9z" />
                  </svg>
                </div>
                <div className="export-option-info">
                  <span className="export-option-title">텍스트 포함 (Canvas)</span>
                  <span className="export-option-desc">텍스트 오버레이가 영상에 합성됩니다</span>
                  <span className="export-option-format">WebM 형식 • 실시간 녹화</span>
                </div>
                <span className="export-option-badge recommended">추천</span>
              </button>

              <button
                className="export-option-item"
                onClick={() => {
                  setShowExportOptions(false);
                  handleExport();
                }}
              >
                <div className="export-option-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </div>
                <div className="export-option-info">
                  <span className="export-option-title">원본 영상 (FFmpeg)</span>
                  <span className="export-option-desc">텍스트 없이 원본 영상만 내보냅니다</span>
                  <span className="export-option-format">MP4 형식 • 빠른 처리</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 내보내기 진행 모달 */}
      {isExporting && (
        <div className="modal-overlay export-modal-overlay">
          <div className="modal-content export-modal">
            <div className="export-progress-container">
              <div className="export-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <h3 className="export-title">영상 내보내기</h3>
              <p className="export-status">{exportStatus}</p>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <p className="export-percent">{exportProgress}%</p>
              <p className="export-hint">처리 중입니다. 잠시만 기다려주세요...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Editor;
