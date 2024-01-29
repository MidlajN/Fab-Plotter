import './style.css';
import { Converter } from 'svg-to-gcode';
import { optimize } from 'svgo';
import { requestSerialPort, closeSerialPort } from './serial';



document.addEventListener('DOMContentLoaded', function () {
  let zoomLevel = 1;
  const maxZoomLevel = 4;
  let svgContent;
  let gcodeArray = [];

  let port;
  let reader;

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
      feedRate : 1100,
      seekRate : 1400
    }
    const converter = new Converter(settings);

    converter.convert(svgContent).then((gcodes) => {

      gcode = gcodes[0];
      gcodeBtn.setAttribute('disabled', true)
      textarea.removeAttribute('disabled')

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


  // -------------------------- Download the Generated G-Code ---------------------------
  document.getElementById('downloadGcode').addEventListener('click', () => {
    const svgFile = new Blob([textarea.value], { type : 'text/plain'})
    const link = document.createElement('a');
    link.href = URL.createObjectURL(svgFile);
    link.download = 'g-code-output.gcode';
    link.click();
    URL.revokeObjectURL(link.href)
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


  // ------------------- Connect to Plotter via Serial API -----------------------
  const serialBtn = document.getElementById('connect');
  serialBtn.addEventListener('click', async () => {
    // Filter on devices with the Arduino Uno USB Vendor/Product IDs.
    const filters = [
      { usbVendorId: 0x2341, usbProductId: 0x0043 },
      { usbVendorId: 0x2341, usbProductId: 0x0001 }
    ];

    // Prompt user to select an Arduino Uno device.
    port = await navigator.serial.requestPort();


    // port = await navigator.serial.requestPort();
    const { usbProductId, usbVendorId } = port.getInfo();
    console.log("portInfo :::", usbProductId, usbVendorId);
    await port.open({ baudRate: 115200 });
    // const encoder = new TextEncoder();
    // const wrt = port.writable.getWriter();
    // wrt.write(encoder.encode("G0 X0 Y0"));
    // wrt.releaseLock();
    console.log('Port opened successfully >>>>', port);

  })


  // ------------------- Send the G-Code to the Plotter through Serial Connection ----------------------
  const sendBtn = document.getElementById('sendSerial');
  sendBtn.addEventListener('click', async () => {
    const reader = port.readable.getReader();
    let gcodeArray = []
    const gcodeString = document.getElementById('gcode').value;
    const gcodeLines = gcodeString.split('\n');
    
    gcodeLines.forEach(line => {
      const trimmedLine = line.trim();

      if (trimmedLine !== ""){
        gcodeArray.push(trimmedLine)
      };
    })

    // const encoder = new TextEncoder();
    // const writer = port.writable.getWriter();
    // await writer.write(encoder.encode("G0 X0Y0\n"));
    // writer.releaseLock();

    for (const command of gcodeArray){
      console.log('Command : ', command)
      const encoder = new TextEncoder();
      const writer = port.writable.getWriter();
      
      await writer.write(encoder.encode(`${command}\n`));
      writer.releaseLock();

      const response =   await reader.read();
      const recievedText = new TextDecoder().decode(response.value);

      if (response) {
        console.log('Command : ' + command + ' >>>>>' + recievedText);
      } else {
        console.error('Unexpected Error : ', response);
        break;
      }
    }
    reader.releaseLock();
  })


  // ------------------- Close the Serial PORT Communication ------------------------
  const closeSerialBtn = document.getElementById('disconnect');
  closeSerialBtn.addEventListener('click', () => {
    closeSerialPort().then(() => {
      document.getElementById('connect').style.display = 'block';
      document.getElementById('disconnect').style.display = 'none';
    })
  })
})



