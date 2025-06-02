var canvas = document.getElementById("myCanvas");
var context = canvas.getContext("2d");

var imageWidth = 1080;
var imageHeight = 1920;

var imageObj = new Image(imageWidth,imageHeight);

imageObj.onload = function()
{
    context.drawImage(imageObj, 0, 0);
}

function DownloadCanvasAsImage() {
    let nameInput = document.getElementById("name").value.trim();

    // Remove spaces and special characters, if needed
    let cleanName = nameInput.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, "_");

    // Set final file name
    let imageName = cleanName
        ? `6D_EidCard_${cleanName}.png`
        : "6D_EidCard.png";

    let downloadLink = document.createElement('a');
    downloadLink.setAttribute('download', imageName);

    canvas.toBlob(function(blob) {
        let url = URL.createObjectURL(blob);
        downloadLink.setAttribute('href', url);
        downloadLink.click();
    });
}

imageObj.src = "assets/images/pe.png"; 

var downloadCardButton = document.getElementById('downloadCard');
downloadCardButton.addEventListener('click', function(e){
    // clear canvas from text and draw image
    context.clearRect(0, 0, imageWidth, imageHeight);
    context.drawImage(imageObj, 0, 0);

    var text = document.getElementById('name').value;

    // custom font
    context.textAlign = 'center';
    context.font = "40pt GESSTwoLight";

    // text color
    context.fillStyle = '#1D1D20';

    // center and make text
    textWidth = (imageWidth - imageWidth / 2)
    textHeight = (imageHeight - 130)
    
    context.fillText(text, textWidth, textHeight);

    e.preventDefault();
    document.getElementById('name').value = "";

    // download the image
    DownloadCanvasAsImage();
});


