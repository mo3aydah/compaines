var canvas = document.getElementById("myCanvas");
var context = canvas.getContext("2d");

var video = document.getElementById("myVideo");

function drawVideoFrameWithText(text) {
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Add text overlay
  context.textAlign = 'center';
  context.font = "80pt DINN";
  context.fillStyle = '#FFFFFF';
  var textWidth = canvas.width / 2;
  var textHeight = canvas.height - 900;
  context.fillText(text, textWidth, textHeight);

  requestAnimationFrame(() => drawVideoFrameWithText(text));
}

// Start the video and the drawing loop when the video is ready
video.addEventListener('play', function() {
  var text = document.getElementById('name').value;
  drawVideoFrameWithText(text);
}, false);

function downloadVideoWithOverlay(text) {
  var stream = canvas.captureStream(30); // 30 FPS
  var chunks = [];
  var recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

  recorder.ondataavailable = function(event) {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  recorder.onstop = function() {
    var blob = new Blob(chunks, { type: 'video/webm' });
    var url = URL.createObjectURL(blob);
    var downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'custom_video.webm';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  recorder.start();

  // Ensure continuous drawing of frames
  function recordFrame() {
    if (recorder.state === 'recording') {
      drawVideoFrameWithText(text);
      requestAnimationFrame(recordFrame);
    }
  }

  recordFrame();

  // Stop the recorder after the duration of the video
  setTimeout(function() {
    recorder.stop();
  }, video.duration * 1000);
}

var downloadCardButton = document.getElementById('downloadCard');
downloadCardButton.addEventListener('click', function(e) {
  var text = document.getElementById('name').value;
  e.preventDefault();
  document.getElementById('name').value = "";

  // Ensure video is playing and then start downloading the video with overlay
  if (video.paused || video.ended) {
    video.play();
    video.onplaying = function() {
      downloadVideoWithOverlay(text);
    };
  } else {
    downloadVideoWithOverlay(text);
  }
});
