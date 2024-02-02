/**
 * This script handles SVG file manipulation, G-code generation, and serial communication with a plotter.
 *
 * Usage:
 * - Drag and drop an SVG file onto the designated drop area to display it.
 * - Alternatively, use the file input element to select and display an SVG file.
 * - Use the mouse wheel to zoom in and out of the displayed SVG content.
 * - Generate G-code from the displayed SVG by clicking the 'Generate G-code' button.
 * - You can Download the generated G-code by clicking the 'Download G-code' button.
 * - Connect to a plotter via serial connection by clicking the 'Connect' button.
 * - Send the generated G-code to the plotter through the serial connection by clicking the 'Send G-code' button.
 * - Close the serial connection to the plotter by clicking the 'Disconnect' button.
 * - Control the plotter's movement using the jog buttons.
 *
 * Dependencies:
 * - './style.css': External CSS file for styling the webpage.
 * - 'svg-to-gcode': Library for converting SVG files to G-code.
 * - 'svgo': Library for optimizing SVG files.
 *
 * Functions:
 * - displaySvg(file): Displays the content of the SVG file in the zoomable container.
 * - displayResponse(command, response): Displays the response received from the plotter in the response area.
 * - closeSerialPort(): Closes the serial connection to the plotter.
 *
 * Global Variables:
 * - zoomLevel: Current zoom level of the zoomable container.
 * - maxZoomLevel: Maximum zoom level allowed for the zoomable container.
 * - svgContent: Content of the loaded SVG file.
 * - gcodeArray: Array to store generated G-code from SVG files.
 * - port: Serial port connection to the plotter.
 *
 * Note: This script utilizes event listeners for drag and drop, file input change, mouse wheel, and button clicks to handle user interactions.
 */

import './style.css';
import { Converter } from 'svg-to-gcode';
import { optimize } from 'svgo';

document.addEventListener('DOMContentLoaded', function () {
  let zoomLevel = 1;
  const maxZoomLevel = 4;
  let svgContent;
  let gcodeArray = [];
  let port;

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
      feedRate : 1000,
      seekRate : 1000
    }
    const converter = new Converter(settings);

    converter.convert(svgContent).then((gcodes) => {

      gcode = gcodes[0];
      gcodeBtn.setAttribute('disabled', true)
      textarea.removeAttribute('disabled')

      // textarea.value = gcode;
      textarea.style.color = 'gray';
      const gcodeLines = gcode.split('\n');
      gcodeLines.forEach(gcode => {
        // remove unnecessary whitespace from each line 
        let trimmedLine = gcode.trim(); 
        if(trimmedLine.includes('G0 Z4')) {
          trimmedLine = 'M03 S000'
        } else if (trimmedLine.includes('G0 Z0')) {
          trimmedLine = 'M03 S123'
        }
        textarea.value += trimmedLine + '\n'
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
    try {
      // Filter on devices with the Arduino Uno USB Vendor/Product IDs.
      const filters = [
        { usbVendorId: 0x2341, usbProductId: 0x0043 },
        { usbVendorId: 0x2341, usbProductId: 0x0001 }
      ];

      // Prompt user to select an Arduino Uno device.
      port = await navigator.serial.requestPort();
      const { usbProductId, usbVendorId } = port.getInfo();
      console.log("portInfo :::", usbProductId, usbVendorId);
      await port.open({ baudRate: 115200 });
      displayResponse('Port Open', 'OK')


      const encoder = new TextEncoder();
      const writer = port.writable.getWriter();
      const reader = port.readable.getReader();
      
      await writer.write(encoder.encode(`G21\n`));
      writer.releaseLock();

      const response =   await reader.read();
      reader.releaseLock();
      const recievedText = new TextDecoder().decode(response.value);
      displayResponse('G21', recievedText)

      serialBtn.style.display = 'none';
      document.getElementById('disconnect').style.display = 'block'

    } catch (error) {
      console.error("Error During Connection::", error)
    }
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

    for (const command of gcodeArray){
      console.log('Command : ', command)
      const encoder = new TextEncoder();
      const writer = port.writable.getWriter();
      
      await writer.write(encoder.encode(`${command}\n`));
      writer.releaseLock();

      const response =   await reader.read();
      const recievedText = new TextDecoder().decode(response.value);

      if (response) {
        displayResponse(command, recievedText)
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


  // ---------------------- Jog Buttons -------------------------
  const controlBtnGroup = document.getElementById('dirBtnGroup');
  const buttons = controlBtnGroup.querySelectorAll('button');

  buttons.forEach(button => {
    button.addEventListener('click', async ()=>{
      const command = button.dataset.command

      try {
        const encoder = new TextEncoder();
        const writer = port.writable.getWriter();
        const reader = port.readable.getReader();
        
        await writer.write(encoder.encode(`${command}\n`));
        writer.releaseLock();
        const response = await reader.read();
        const recievedText = new TextDecoder().decode(response.value);

        displayResponse(command, recievedText)

        if (command === 'M03 S123'){
          button.dataset.command = 'M03 S000';
        } else if (command === 'M03 S000'){
          button.dataset.command = 'M03 S123';
        }

      } catch (error) {
        console.error('ERROR From Jog Buttons >>> \n ', error)
      }
    })
  })

})

function displayResponse(command, response) {
  const textArea = document.getElementById('responseArea');
  textArea.value += `${command} -->> ${response}\n`;
  textArea.scrollTop = textArea.scrollHeight - 1;
}

const closeSerialPort = async() => {
  if (port) {
    await reader.releaseLock();
    await port.close();
    console.log('Port closed successfully >>>>', port);
  }
};

