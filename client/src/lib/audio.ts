export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private audioContext: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private trimStart: number = 0;
  private trimEnd: number = 0;

  async startRecording() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      source.connect(this.analyser);

      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.start();
      return true;
    } catch (err) {
      console.error("Error starting recording:", err);
      return false;
    }
  }

  async stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.stream?.getTracks().forEach(track => track.stop());

        // Convert blob to AudioBuffer for editing
        const arrayBuffer = await audioBlob.arrayBuffer();
        this.audioBuffer = await this.audioContext?.decodeAudioData(arrayBuffer) || null;
        this.trimEnd = this.audioBuffer?.duration || 0;

        this.stream = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  getAnalyserData() {
    if (!this.analyser) return new Uint8Array(0);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(data);
    return data;
  }

  isRecording() {
    return this.mediaRecorder?.state === 'recording';
  }

  // New methods for trimming functionality
  setTrimPoints(start: number, end: number) {
    if (!this.audioBuffer) return;
    this.trimStart = Math.max(0, Math.min(start, this.audioBuffer.duration));
    this.trimEnd = Math.max(0, Math.min(end, this.audioBuffer.duration));
  }

  getTrimPoints() {
    return {
      start: this.trimStart,
      end: this.trimEnd,
      duration: this.audioBuffer?.duration || 0
    };
  }

  async getTrimmedAudio(): Promise<Blob | null> {
    if (!this.audioBuffer || !this.audioContext) return null;

    const trimmedLength = (this.trimEnd - this.trimStart) * this.audioBuffer.sampleRate;
    const trimmedBuffer = this.audioContext.createBuffer(
      this.audioBuffer.numberOfChannels,
      trimmedLength,
      this.audioBuffer.sampleRate
    );

    // Copy the trimmed portion
    for (let channel = 0; channel < this.audioBuffer.numberOfChannels; channel++) {
      const channelData = this.audioBuffer.getChannelData(channel);
      const trimmedData = trimmedBuffer.getChannelData(channel);
      const startOffset = Math.floor(this.trimStart * this.audioBuffer.sampleRate);

      for (let i = 0; i < trimmedLength; i++) {
        trimmedData[i] = channelData[startOffset + i];
      }
    }

    // Convert AudioBuffer to Blob
    const offlineContext = new OfflineAudioContext(
      trimmedBuffer.numberOfChannels,
      trimmedBuffer.length,
      trimmedBuffer.sampleRate
    );

    const source = offlineContext.createBufferSource();
    source.buffer = trimmedBuffer;
    source.connect(offlineContext.destination);
    source.start();

    const renderedBuffer = await offlineContext.startRendering();
    const wavData = this.audioBufferToWav(renderedBuffer);
    return new Blob([wavData], { type: 'audio/wav' });
  }

  private audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;
    const dataSize = buffer.length * blockAlign;
    const bufferLength = 44 + dataSize;
    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, bufferLength - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    // Write audio data
    const samples = buffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      const sample = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }

    return arrayBuffer;
  }
}