export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private deviceId: string | null = null;
  private analyser: AnalyserNode | null = null;
  private audioContext: AudioContext | null = null;

  // Ensure we're in a browser environment
  private static isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof navigator !== 'undefined';
  }

  setDevice(deviceId: string) {
    this.deviceId = deviceId;
  }

  static async getAudioDevices(): Promise<MediaDeviceInfo[]> {
    if (!AudioRecorder.isBrowser()) {
      return [];
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'audioinput');
    } catch (err) {
      console.error("Error getting audio devices:", err);
      throw err;
    }
  }

  async startRecording(): Promise<boolean> {
    if (!AudioRecorder.isBrowser()) {
      throw new Error("AudioRecorder cannot run in a non-browser environment");
    }

    try {
      // Clean up any existing resources
      this.cleanup();

      // Set up audio constraints
      const constraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      };

      if (this.deviceId) {
        constraints.deviceId = { exact: this.deviceId };
      }

      // Get media stream
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: constraints
      });

      // Set up audio context and analyzer for visualization only
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;

      // Create media stream source and connect to analyzer
      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.analyser);

      // Determine supported MIME type
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      }

      // Create MediaRecorder with the original stream
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType,
        audioBitsPerSecond: 128000
      });

      this.audioChunks = [];

      // Handle incoming audio data
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Start recording
      this.mediaRecorder.start(100); // Collect data every 100ms
      return true;

    } catch (err) {
      console.error("Error starting recording:", err);
      this.cleanup();
      throw err;
    }
  }

  async stopRecording(): Promise<Blob | null> {
    if (!AudioRecorder.isBrowser()) {
      return null;
    }

    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { 
          type: this.mediaRecorder?.mimeType || 'audio/webm'
        });
        this.cleanup();
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  private cleanup() {
    // Stop all tracks in the stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    // Clean up audio context and analyzer
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
      this.analyser = null;
    }

    // Clear recorder and chunks
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  getAnalyserData(): Uint8Array {
    if (!AudioRecorder.isBrowser() || !this.analyser) {
      return new Uint8Array(128).fill(128);
    }

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}