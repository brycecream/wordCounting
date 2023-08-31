let camera, scene, renderer;
let words = [];
let models = [];
let correctCount = 0;
let globalModel;


async function loadModel() {
  return new Promise((resolve, reject) => {
    const loader = new THREE.GLTFLoader();
    loader.load('model/scene.gltf', function(gltf) {
      const model = gltf.scene;
      model.scale.set(3, 3, 3);
      resolve(model);
    });
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function toggleControlPanel() {
  const controlPanel = document.getElementById("controlPanel");
  if (controlPanel.style.display === "none") {
    controlPanel.style.display = "block";
  } else {
    controlPanel.style.display = "none";
  }
}

async function init() {
  const container = document.getElementById('canvas');
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 10);
  camera.position.z = 5;
  scene = new THREE.Scene();

  // Load and set the background image
  const loader = new THREE.TextureLoader();
  loader.load('1694.jpg', function(texture) {
    scene.background = texture;
  });

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(0, 1, 0);
  scene.add(directionalLight);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  window.addEventListener('resize', onWindowResize, false);

  document.getElementById("controlPanel").style.display = "block";

  globalModel = await loadModel();

  animate();
}


function animate() {
  requestAnimationFrame(animate);

  const time = Date.now() * 0.001;  // Current time in seconds

  words.forEach(word => {
    if (word && word.position && word.velocity) {
      word.position.x += word.velocity.x;
      if (Math.abs(word.position.x) > 8) {
        scene.remove(word);
        words = words.filter(w => w !== word);
      }
    }
  });

  models.forEach(model => {
    if (model && model.position && model.velocity) {
      model.position.x += model.velocity.x;
      if (Math.abs(model.position.x) > 8) {
        scene.remove(model);
        models = models.filter(m => m !== model);
      }

      // Make the model "rock" back and forth along the Z-axis
      const amplitudeZ = 0.1;  // Amplitude of the rocking motion along the Z-axis
      model.rotation.z = amplitudeZ * Math.sin(time * 2 * Math.PI);  // Oscillate the rotation around the Z-axis

      // Make the model "tilt" side to side along the X-axis
      const amplitudeX = .2;  // Amplitude of the tilting motion along the X-axis
      model.rotation.x = amplitudeX * Math.sin(time * 1.5 * Math.PI);  // Oscillate the rotation around the X-axis
    }
  });

  renderer.render(scene, camera);
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

async function startCountdown() {
  // Show the countdown panel
  const countdownPanel = document.getElementById('countdownPanel');
  countdownPanel.style.display = 'block';

  // Get the word from the input and display it
  const inputText = document.getElementById('wordInput').value;
  document.getElementById('countdownWord').textContent = inputText;

  // Start the countdown
  let countdown = 5;
  const countdownTimer = document.getElementById('countdownTimer');
  countdownTimer.textContent = countdown;

  return new Promise(resolve => {
    const interval = setInterval(() => {
      countdown--;
      countdownTimer.textContent = countdown;

      if (countdown === 0) {
        clearInterval(interval);
        countdownPanel.style.display = 'none';  // Hide the countdown panel
        resolve();
      }
    }, 1000);
  });
}


async function generateWords() {
  toggleControlPanel();

  // Start the countdown
  await startCountdown();

  const inputText = document.getElementById('wordInput').value;
  if (!inputText) return;

  const fontLoader = new THREE.FontLoader();
  fontLoader.load('test2.json', function(font) {
    correctCount = 0;

    // Generate a random number between 10 and 30
    const numWords = Math.floor(Math.random() * (31 - 10)) + 10;

    for (let i = 0; i < numWords; i++) {
      setTimeout(() => {
        let text = inputText;

        if (Math.random() < 0.3) {
          text = introduceTypos(text, 1);
        } else {
          correctCount++;
        }

        let textGeometry = new THREE.TextGeometry(text, {
          font: font,
          size: 0.5,
          height: 0,
        });

        const textMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const mesh = new THREE.Mesh(textGeometry, textMaterial);

        const minVelocity = -0.09;
        const maxVelocity = 0.09;
        let velocityX;
        
        do {
          velocityX = Math.random() * (maxVelocity - minVelocity) + minVelocity;
        } while (Math.abs(velocityX) < 0.05);  // Re-generate if the absolute value is less than 0.05
        

        const minY = -2;
        const maxY = 3;
        const randomY = Math.random() * (maxY - minY) + minY;

        const initialX = velocityX > 0 ? -8 : 8;

        mesh.position.set(initialX, randomY, 0);
        mesh.velocity = { x: velocityX };

        scene.add(mesh);
        words.push(mesh);

        if (globalModel) {
          const modelClone = globalModel.clone();
          const textMeshBoundingBox = new THREE.Box3().setFromObject(mesh);
          const textMeshSize = textMeshBoundingBox.getSize(new THREE.Vector3());
        
          // Position the model directly below the text
          modelClone.position.set(initialX, mesh.position.y - textMeshSize.y, mesh.position.z);
          modelClone.velocity = { x: velocityX };
        
          // Try setting the initial rotation based on the direction of movement.
          // You may need to adjust these values.
           if (velocityX > 0) {
    modelClone.rotation.set(0, -Math.PI / 2, 0);  // Adjust these values
  } else {
    modelClone.rotation.set(0, Math.PI / 2, 0);  // Adjust these values
  }
        
          // Store the initial Z rotation for later use
          modelClone.userData.initialZRotation = modelClone.rotation.z;
        
          scene.add(modelClone);
          models.push(modelClone);
        }
      }, i * 2000);
    }

    setTimeout(() => {
      toggleControlPanel();
    
      const choices = [correctCount, correctCount + 1, correctCount - 1, correctCount + 2];
      shuffleArray(choices);  // Shuffle the choices
    
      document.getElementById('choice1').textContent = choices[0];
      document.getElementById('choice2').textContent = choices[1];
      document.getElementById('choice3').textContent = choices[2];
      document.getElementById('choice4').textContent = choices[3];
    }, numWords * 2000 + 2000);
  });
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
 
function checkChoice(event) {
  const userChoice = parseInt(event.target.textContent, 10);
  if (userChoice === correctCount) {
    alert("Correct!");
  } else {
    alert("Wrong!");
  }
}

document.getElementById('generateBtn').addEventListener('click', generateWords);
document.getElementById('choice1').addEventListener('click', checkChoice);
document.getElementById('choice2').addEventListener('click', checkChoice);
document.getElementById('choice3').addEventListener('click', checkChoice);
document.getElementById('choice4').addEventListener('click', checkChoice);

init();
