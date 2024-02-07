# Fab-Plotter

The Fab-Plotter Interface helps in converting SVG (Scalable Vector Graphics) files into plottable G-code instructions.
## Functionality

1. **SVG Import and Display**:
   - Users can import SVG files by dragging and dropping them onto the specified area or selecting them via the file input element. The imported SVG content is then displayed within the application for previewing designs.

2. **G-code Generation**:
   - The application utilizes the 'svg-to-gcode' library to generate G-code instructions from imported SVG files. Users can customize settings like feed rate and seek rate to tailor the G-code generation process to their needs.

3. **G-code Download**:
   - Upon G-code generation, users have the option to download the resulting file locally for further use with their plotters.

4. **Plotter Connection and Communication**:
   - Users can establish serial connections with their plotters through the application using the Web Serial API. The application facilitates sending generated G-code instructions directly to the plotter for execution.

5. **Plotter Control**:
   - The interface includes jog buttons that enable users to control the movement of the plotter, facilitating precise positioning and alignment.

6. **Serial Connection Management**:
   - Users can easily establish, maintain, and terminate serial connections with their plotters as needed, ensuring smooth communication.

## Usage

1. **Importing SVG Files**:
   - Drag and drop SVG files onto the specified area or use the file input element to select files for import.

2. **Generating G-code**:
   - Click the "Generate G-code" button to initiate the conversion of imported SVG files into G-code instructions.

3. **Downloading G-code**:
   - After G-code generation, users can download the resulting file by clicking the "Download G-code" button.

4. **Plotter Connection**:
   - Connect to a plotter via a serial connection by selecting the appropriate serial port and clicking the "Connect" button.

5. **Sending G-code to Plotter**:
   - Transmit the generated G-code instructions to the plotter by clicking the "Send G-code" button.

6. **Controlling Plotter Movement**:
   - Use the jog buttons to control the movement of the plotter, enabling precise adjustments and positioning.

7. **Closing Plotter Connection**:
   - Terminate the serial connection to the plotter by clicking the "Disconnect" button when communication is no longer required.

## Technologies Used

- **Vite**: The application is built using Vite, a fast frontend tooling framework.
- **JavaScript**: Provides dynamic functionality and interactivity to the application.
- **HTML/CSS**: Structures the webpage and styles the user interface.
- **Web Serial API**: Enables serial communication with plotters directly from the web browser.
- **SVG-to-G-code Conversion Library**: Integrates the 'svg-to-gcode' library for converting SVG files into G-code instructions.

## Installation

To install and run the SVG to G-code Plotter Interface:

1. Clone the repository:

   ```
   git clone https://github.com/MidlajN/Fab-Plotter.git
   ```

2. Navigate to the project directory:

   ```
   cd Fab-Plotter
   ```

3. Install dependencies:

   ```
   npm install
   ```

4. Start the development server:

   ```
   npm run dev
   ```

5. Open your web browser and visit the specified URL to access the application.

## Note

- Ensure that your web browser supports the Web Serial API for establishing serial connections with your plotters.
- Don't extend or scale the svg. (All the transformations must be made in the svg file, without any redimensional function)

Feel free to explore the application and contribute to its development on [GitHub](https://github.com/MidlajN/Fab-Plotter).
