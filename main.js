import './style.css';
import { Converter } from 'svg-to-gcode';
import { optimize } from 'svgo';
import { requestSerialPort, closeSerialPort } from './serial';


document.addEventListener('DOMContentLoaded', function () {
  let zoomLevel = 1;
  const maxZoomLevel = 4;
  let svgContent;
  let gcodeArray = [];

  // ------------------- Drag and Drop & Input Functions ----------------------
  const dropArea = document.getElementById('dropArea');
  const svgInput = document.getElementById('svgInput');
  const svgInputDiv = document.getElementById('drop');

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
  const zoomContainer = document.getElementById('result');
  const zoomedContent = document.getElementById('zoomContainer');

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


  // ---------------------- G-Code Generation From SVG ------------------------- 
  const gcodeBtn = document.getElementById('generateGcode');
  // const clrBtn = document.getElementById('clearCode');
  const textarea = document.getElementById('gcode')
  
  gcodeBtn.addEventListener('click', () => {
    const result = optimize(svgContent);
    const optimizedSvg = result.data; // Optionally the optimized SVG can be used
    let gcode;
    
    const zOffset = 4;
    const feedRate = document.getElementById('feedRate').value;
    const seekRate = document.getElementById('seekRate').value;

    const settings = {
      zOffset : zOffset,
      feedRate : 100,
      seekRate : 200
    }
    const converter = new Converter(settings);

    converter.convert(svgContent).then((gcodes) => {
      console.log('GCODE FROM CONVERTER ::::', gcodes)
      gcode = gcodes[0];
      gcodeBtn.setAttribute('disabled', true)
      // textarea.removeAttribute('disabled')

      textarea.value = gcode;
      textarea.style.color = 'gray';
      const gcodeLines = gcode.split('\n');
      gcodeLines.forEach(gcode => {
        // remove unnecessary whitespace from each line 
        const trimmedLine = gcode.trim(); 
        if (trimmedLine !== "") {
          gcodeArray.push(trimmedLine)
        }
      });
    })

    // // Clear G-Code Button
    // clrBtn.style.color = 'red'
    // clrBtn.removeAttribute('disabled');
    // clrBtn.classList.add('clearCode');
  })


  // ------------ Button For Clearing the Existing G-Code from the textarea -----------
  // clrBtn.addEventListener('click', () => {
  //   document.getElementById('gcode').value = '';
  //   document.getElementById('gcode').setAttribute('disabled', true);
  //   clrBtn.setAttribute('disabled', true);
  //   clrBtn.classList.remove('clearCode');
  //   clrBtn.style.color = 'white';
  //   gcodeBtn.removeAttribute('disabled')
  //   console.log(gcodeLines)
  // })


  // ------------------- Connect & Send the G-Code to Plotter via Serial API -----------------------
  const serialBtn = document.getElementById('connect');
  serialBtn.addEventListener('click', () => {
    console.log('Connect Btn', gcodeArray)
    requestSerialPort().then(() => {
      serialBtn.style.display = 'none';
      document.getElementById('disconnect').style.display = 'block'
    })
  })

  const closeSerialBtn = document.getElementById('disconnect');
  closeSerialBtn.addEventListener('click', () => {
    closeSerialPort().then(() => {
      document.getElementById('connect').style.display = 'block';
      document.getElementById('disconnect').style.display = 'none';
    })
  })
})



