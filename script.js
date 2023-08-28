// Declare global variables for the Three.js scene, camera, renderer, and game logic.
let camera, scene, renderer;
let words = [];  // Array to store the 3D text objects.
let correctCount = 0;  // Counter for correct word instances.



function onWindowResize() {
  // Update camera aspect ratio
  camera.aspect = window.innerWidth / window.innerHeight;

  // Update the camera's frustum
  camera.updateProjectionMatrix();

  // Update the size of the renderer AND the canvas
  renderer.setSize(window.innerWidth, window.innerHeight);
}


// Initialize the Three.js scene, camera, and renderer.
function init() {
  
  // Get the container to which we'll attach the renderer.
  const container = document.getElementById('canvas');
  
  // Initialize a perspective camera.
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);
  camera.position.z = 5;  // Set the camera's position.

  // Create a new Three.js scene.
  scene = new THREE.Scene();

  // Initialize the WebGL renderer with antialiasing.
  renderer = new THREE.WebGLRenderer({ antialias: true });

    // Handle high-density displays
    renderer.setPixelRatio(window.devicePixelRatio);


  // Set the renderer size to fill the window.
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Attach the renderer's output (the canvas) to the container.
  container.appendChild(renderer.domElement);

  // Call the resize function to fit the initial window size.
  onWindowResize();

  // Attach the resize event listener to the window
  window.addEventListener('resize', onWindowResize, false);

  // Start the animation loop.
  animate();
}

// Function for the animation loop.
function animate() {
  // Request a new animation frame.
  requestAnimationFrame(animate);

  // Loop through each word object to update its position.
  words.forEach(word => {
    // Update the x-coordinate of the word's position based on its velocity.
    word.position.x += word.velocity.x;

    // Remove the word from the scene if it goes too far off-screen.
    if (Math.abs(word.position.x) > 8) {
      scene.remove(word);
      words = words.filter(w => w !== word);  // Remove the word from the array.
    }
  });

  // Render the scene from the camera's viewpoint.
  renderer.render(scene, camera);
}

// Function to shuffle an array.
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];  // Swap elements.
  }
}

// Function to check if the user's guess is correct.
function checkChoice(event) {
  // Parse the user's choice.
  const userChoice = parseInt(event.target.textContent, 10);
  
  // Get the element where the result will be displayed.
  const resultElement = document.getElementById("result");

  // Check if the user's choice matches the correct count.
  if (userChoice === correctCount) {
    resultElement.textContent = "Correct!";
    resultElement.style.color = "green";
  } else {
    resultElement.textContent = "Wrong!";
    resultElement.style.color = "red";
  }
}

function introduceTypos(word, numTypos) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  let typoWord = word;

  for (let i = 0; i < numTypos; i++) {
    const randomIndex = Math.floor(Math.random() * typoWord.length);
    const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
    typoWord = typoWord.substring(0, randomIndex) + randomLetter + typoWord.substring(randomIndex);
  }

  return typoWord;
}

// Function to toggle visibility of the control panel
function toggleControlPanel() {
  const controlPanel = document.getElementById("controlPanel");
  if (controlPanel.style.display === "none") {
    controlPanel.style.display = "block";
  } else {
    controlPanel.style.display = "none";
  }
}

// Updated generateWords function
function generateWords() {
  // Reset correct count
  correctCount = 0;

  // Hide the control panel after clicking the button
  toggleControlPanel();

  // Get user input
  const userInput = document.getElementById("wordInput").value;

  // Generate 3D text
  const loader = new THREE.FontLoader();
  loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
    const numWords = Math.floor(Math.random() * 11) + 10; // Random number of words between 10 and 20
    const spawnPositionsY = new Set(); // Store Y positions of spawned words

    for (let i = 0; i < numWords; i++) {
      setTimeout(() => {
        let text = userInput;

        if (Math.random() < 0.3 && text.length > 1) {
          const numTypos = Math.floor(Math.random() * 2) + 2; // Number of typos will be either 2 or 3
          text = introduceTypos(text, numTypos);
        } else {
          correctCount++;
        }

        // Generate the 3D geometry for the word.
        const geometry = new THREE.TextGeometry(text, {
          font: font,
          size: 0.6,
          height: 0.05,
          curveSegments: 12,
          bevelEnabled: false,
        });

        // Create a red material for the word.
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });

        // Create a mesh for the 3D word.
        const mesh = new THREE.Mesh(geometry, material);

        // Assign random velocity for the word's movement.
        const randomSpeed = (Math.random() + 0.5) * 0.04; // Speed between 0.005 and 0.015
        mesh.velocity = { x: Math.random() > 0.5 ? randomSpeed : -randomSpeed };

        // Set an initial random position for the word.
        let posY;
        do {
          posY = Math.random() * 6 - 3; // Random Y position
        } while (spawnPositionsY.has(posY)); // Ensure no overlapping on the same line
        spawnPositionsY.add(posY);
        mesh.position.set(mesh.velocity.x > 0 ? -5 : 5, posY, Math.random() * 2 - 1);

        // Add the word to the Three.js scene and the words array.
        scene.add(mesh);
        words.push(mesh);
      }, i * 1000);
    }

    // Show the control panel back and update the multiple-choice options after all words are generated.
    setTimeout(() => {
      toggleControlPanel();
      
      // Create multiple-choice options.
      const choices = [correctCount, correctCount + 1, correctCount - 1, correctCount + 2];
      shuffle(choices);

      // Update the text content of the multiple-choice buttons.
      document.getElementById("choice1").textContent = choices[0];
      document.getElementById("choice2").textContent = choices[1];
      document.getElementById("choice3").textContent = choices[2];
      document.getElementById("choice4").textContent = choices[3];
    }, (numWords + 2) * 1000);  // Wait for all words to be generated + 1s buffer time.
  });
}


// Your DOMContentLoaded code should look the same
document.addEventListener("DOMContentLoaded", function () {
  init();  // Initialize the Three.js scene.
  
  // Make sure controlPanel is initially visible
  document.getElementById("controlPanel").style.display = "block";

  // Attach event listeners to various elements.
  document.getElementById("generateBtn").addEventListener("click", generateWords);
  document.getElementById("choice1").addEventListener("click", checkChoice);
  document.getElementById("choice2").addEventListener("click", checkChoice);
  document.getElementById("choice3").addEventListener("click", checkChoice);
  document.getElementById("choice4").addEventListener("click", checkChoice);
});





