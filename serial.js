
let port;
let reader;

/**
 * Retrieves the serial port for the given element and listens for data from the serial device.
 *
 * @param {Element} element - The element to attach the click event listener to.
 * @return {void}
 */
export const requestSerialPort = async () => {
  port = await navigator.serial.requestPort();
  const { usbProductId, usbVendorId } = port.getInfo();
  console.log("portInfo :::", usbProductId, usbVendorId);
  await port.open({ baudRate: 9600 });
  console.log('Port opened successfully >>>>', port);

  let receivedText = '';
  reader = port.readable.getReader();

  const appendMsg = (msg) => {
    document.getElementById('outputMsg').value += msg;
  }
  const processMessage = async () => {
    const { value, done } = await reader.read();
    if (!done) {
      const decoder = new TextDecoder();
      const text = decoder.decode(value);
      receivedText += text;

      const newlineIndex = receivedText.indexOf('\n');
      if (newlineIndex !== -1) {
        const completeMessage = receivedText.substring(0, newlineIndex + 1);
        receivedText = receivedText.substring(newlineIndex + 1);
        appendMsg(completeMessage);
      }
      // Continue processing messages
      processMessage();
    } else {
      // Allow the serial port to be closed later.
      reader.releaseLock();
    }
  };
  // Start processing messages
  processMessage();
};


export const closeSerialPort = async() => {
  if (port) {
    await reader.releaseLock();
    await port.close();
    console.log('Port closed successfully >>>>', port);
  }
};

let isToggled = true;

export async function writeSerial() {
  const encoder = new TextEncoder();
  const writer = port.writable.getWriter();

  // Toggle between '1' and '0'
  const dataToSend = isToggled ? '1' : '0';
  isToggled = !isToggled;

  writer.write(encoder.encode(dataToSend)).then(() => {
    if (dataToSend === '0') {
      document.getElementById('toggle').innerHTML = `<i class="fa-solid fa-lightbulb" style="color: #c20d0da8"></i>`;
    } else {
      document.getElementById('toggle').innerHTML = `<i class="fa-solid fa-lightbulb" style="color: #2f5917"></i>`;
    }
    
  });
  writer.releaseLock();
}

export const gcodeToText = async (fileInput) => {
  const file = fileInput.files[0];
  const encoder = new TextEncoder();
  const writer = port.writable.getWriter();

  if (file) {
    const gcodeText = await file.text();
    await writer.write(encoder.encode(gcodeText));
    writer.releaseLock();
    console.log('Gcode sent successfully >>>>', gcodeText);
  } else {
    console.error('No file selected');
  }
}