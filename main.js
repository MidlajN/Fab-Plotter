import './style.css';
import { Converter } from 'svg-to-gcode';
import { optimize } from 'svgo';


document.getElementById('gcode').onchange =()=>{
  console.log(document.getElementById('gcode').value)
}


document.addEventListener('DOMContentLoaded', function () {
  const dropArea = document.getElementById('dropArea');
  const svgInput = document.getElementById('svgInput');
  const svgInputDiv = document.getElementById('drop');

  const zoomContainer = document.getElementById('result');
  const zoomedContent = document.getElementById('zoomContainer');

  let svgContent;
  let gcodeLines;

  dropArea.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dropArea.style.boxShadow = 'rgb(0 159 255 / 31%) 0px 0px 16px 8px inset';
    // dropArea.style.cursor = 'pointer';
  })
  dropArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropArea.style.boxShadow = 'inset 0px 0px 7px 5px #0000001f';
    svgInputDiv.style.opacity = '1'
  })
  dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    svgInputDiv.style.opacity = '0.5'
  })
  dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.style.boxShadow = 'inset 0px 0px 7px 5px #0000001f';
    
    const svgFiles = e.dataTransfer.files;
    displaySvg(svgFiles[0])
  })

  svgInput.addEventListener('change', (e) => {
    const svgFiles = e.target.files;
    displaySvg(svgFiles[0])
    console.log('FILES ::', svgFiles[0]) 
  })



  // --------------------------- Zoom The Layer Using Mouse Wheel ---------------------------
  let zoomLevel = 1;
  const maxZoomLevel = 4

  zoomContainer.addEventListener('wheel', (event) => {
    event.preventDefault();

    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1; // Adjust the zoom speed

    const rect = zoomedContent.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const offsetX = (mouseX / rect.width) * 100;
    const offsetY = (mouseY / rect.height) * 100;

    const newZoomLevel = zoomLevel * zoomFactor;
    zoomLevel = Math.max(1, Math.min(maxZoomLevel, newZoomLevel)); // Ensure zoom doesn't go below 100%

    zoomedContent.style.transformOrigin = `${offsetX}% ${offsetY}%`;
    zoomedContent.style.transform = `scale(${zoomLevel})`;
  });

  function displaySvg(file){
    if (file) {
      const reader = new FileReader();
  
      reader.onload = (e) => {
        svgContent = e.target.result;
        zoomedContent.innerHTML = svgContent
        zoomContainer.style.opacity = '1';
        svgInputDiv.style.display = 'none';
      }
      reader.readAsText(file)
    }
  }


  const gcodeBtn = document.getElementById('generateGcode');
  gcodeBtn.addEventListener('click', async () => {
    const result = optimize(svgContent);
    const optimizedSvg = result.data; // Optionally the optimized SVG can be used
    
    const zOffset = 4;
    const feedRate = document.getElementById('feedRate').value;
    const seekRate = document.getElementById('seekRate').value;

    const settings = {
      zOffset : zOffset,
      feedRate : feedRate,
      seekRate : seekRate
    }
    const converter = new Converter(settings)

    const gcode = await converter.convert(svgContent)
    const textarea = document.getElementById('gcode')
    gcodeBtn.setAttribute('disabled', true)
    textarea.value = gcode[0];
    // textarea.removeAttribute('disabled')
    textarea.style.color = 'gray';

    gcodeLines = gcode[0].split('\n')
  })
  
})



