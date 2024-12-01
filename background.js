chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Check if the URL matches Google Meet or Zoom
    if (changeInfo.url && (changeInfo.url.includes("meet.google.com") || changeInfo.url.includes("zoom.us"))) {
      console.log("Meeting detected in tab:", tabId);
      captureTabAudio(tabId);  // Start capturing audio from the tab
    }
  });
  
  function captureTabAudio(tabId) {
    // Capture audio from the active tab
    chrome.tabCapture.capture({ audio: true }, function (stream) {
      if (chrome.runtime.lastError) {
        console.error("Error capturing audio:", chrome.runtime.lastError);
        return;
      }
  
      console.log("Audio stream captured from tab:", tabId);
      processAudioStream(stream);  // Process the audio data and send it to the backend
    });
  }
  
  function processAudioStream(stream) {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
  
    processor.onaudioprocess = function (event) {
      // Get audio data from the stream
      const audioData = event.inputBuffer.getChannelData(0);
      sendAudioToBackend(audioData);  // Send audio data to the backend
    };
  
    source.connect(processor);
    processor.connect(audioContext.destination);
  }
  
  function sendAudioToBackend(audioData) {
    // Convert the audio data to Base64 format
    const audioBase64 = arrayBufferToBase64(audioData);
  
    // Send the audio data to the backend for transcription
    fetch('http://127.0.0.1:8000/api/transcribe-audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio: audioBase64 })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Transcription Result:', data.transcription);
      // Display or process the transcription result
    })
    .catch(error => {
      console.error('Error sending audio to backend:', error);
    });
  }
  
  function arrayBufferToBase64(buffer) {
    const byteArray = new Uint8Array(buffer);
    const binary = byteArray.reduce((data, byte) => data + String.fromCharCode(byte), '');
    return btoa(binary);  // Base64 encoding
  }
  