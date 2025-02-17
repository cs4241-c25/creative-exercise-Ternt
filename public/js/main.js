import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import '../assets/maxwell_the_cat_with_bones.glb'

const appState = {
  appPaused: true,
}

window.onload = () => {
  // Audio Initialization
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();

  const input = document.getElementById('file-input');
  const songStatus = document.getElementById('song-status');
  const audioElement = document.querySelector('audio');
  const audioSource = document.createElement('source');

  input.addEventListener("change", () => {

    if (input.files.length == 1) {
      audioSource.setAttribute('src', URL.createObjectURL(input.files[0]));
      audioSource.setAttribute('type', input.files[0].type);
      audioElement.appendChild(audioSource);
      console.log(input.files[0]);
      songStatus.innerHTML = `Currently playing "${input.files[0].name}"`;

      const track = audioCtx.createMediaElementSource(audioElement);

      // Create a gain node
      const gainNode = audioCtx.createGain();

      track.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      document.querySelector('button').blur();
    }
  });

  // Graphics Initialization
  let width = window.innerWidth;
  let height = window.innerHeight;

  const clock = new THREE.Clock(); 
  const scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x222222 );
  scene.fog = new THREE.Fog( scene.background, 1, 2000 );

  const camera = new THREE.PerspectiveCamera( 40, width / height, 0.1, 2500 );

  const renderer = new THREE.WebGLRenderer();

  let mixer;
  let action;

  renderer.shadowMap.enabled = true;
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( width, height );
  document.getElementById('content-feed').appendChild( renderer.domElement );


  const controls = new OrbitControls( camera, renderer.domElement );
  controls.enableZoom     = true;
  controls.enableDamping  = true;
  controls.dampingFactor  = 0.05;
  controls.rotateSpeed    = 0.70;


  const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x8d8d8d, 3 );
  hemiLight.position.set( 0, 20, 0 );
  scene.add( hemiLight );

  const dirLight = new THREE.DirectionalLight( 0xffffff, 3 );
  dirLight.position.set( 3, 10, 10 );
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 2;
  dirLight.shadow.camera.bottom = - 2;
  dirLight.shadow.camera.left = - 2;
  dirLight.shadow.camera.right = 2;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 40;
  scene.add( dirLight );


  const groundGeo = new THREE.PlaneGeometry( 10000, 10000 );
  const groundMat = new THREE.MeshBasicMaterial( { color: 0xffffff } );
  groundMat.color = new THREE.Color( 0x181818 );

  const ground = new THREE.Mesh( groundGeo, groundMat );
  ground.position.y = - 20;
  ground.rotation.x = - Math.PI / 2;
  ground.receiveShadow = true;
  scene.add( ground );


  const loader = new GLTFLoader();
  loader.load(
    'assets/maxwell_the_cat_with_bones.glb',
    (glb) => {
      console.log(glb);
      const model = glb.scene;
      model.scale.set( 2, 2, 2 );
      model.rotateY( Math.PI / 4 );
      model.castShadow = true;
      model.receiveShadow = true;

      scene.add( model );

      mixer = new THREE.AnimationMixer( model );
      action = new THREE.AnimationAction(mixer, glb.animations[0], model, THREE.NormalAnimationBlendMode);

      renderer.setAnimationLoop( animate );
    },
    function (xhr) {
      console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
    },
    function (error) {
      console.log("An error happened:", error);
    }
  );

  camera.position.set( 0, 2.5, 6 );

  function animate() {
    const delta = clock.getDelta();
    mixer.update( delta );
    controls.update();
    renderer.render( scene, camera );
  }


  // DOM stuff
  const button = document.querySelector('button');
  button.onclick = () => { input.click(); }


  function onClickOutside (element, callback) {
    document.onmousedown = (event) => {
      if (!element.contains(event.target)) callback();
    };
  };

  function onKeyPress(callback) {
    document.onkeydown = (event) => {
      callback();
    };
  }

  function fadeOut(element, duration) {
    element.style.transition = `opacity ${duration / 1000}s`;
    element.style.opacity = 0;

    setTimeout(() => {
      element.style.display = 'none';
      document.body.removeChild(element);
    }, duration);
  }

  const welcomeModal = document.createElement("div");
  welcomeModal.classList.add('welcome-modal-container');

  welcomeModal.innerHTML = `
            <div class="welcome-modal-box">
                <a class="welcome-modal-title">Greetings!</a>
                <p class="welcome-paragraph">Welcome to <a class="inline-bold">Maxwell's Music Player</a>! Click on the bottom logo to add a song for Maxwell to dance to. After you've added a song, press + hold <a class="inline-bold">Space</a> to have Maxwell jiggle and wiggle to the song!</p>
            </div>`;

  onClickOutside(welcomeModal, () => {
    document.onkeydown = null;
    fadeOut(welcomeModal, 1000);
    fadeOut(dimmingDiv, 1000);
    document.getElementById('content-feed').classList.remove('blur');
    document.onmousedown = null;
  });

  onKeyPress(() => {
    document.onmousedown = null;
    fadeOut(welcomeModal, 1000);
    fadeOut(dimmingDiv, 1000);
    document.getElementById('content-feed').classList.remove('blur');
    document.onkeydown = null;
  });

  const dimmingDiv   = document.createElement("div");
  dimmingDiv.id = 'dimming-div';
  document.getElementById('content-feed').classList.add('blur');

  document.body.appendChild(welcomeModal);
  document.body.appendChild(dimmingDiv);

  // App Events
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);

  function onWindowResize() {
    width = window.innerWidth; height = window.innerHeight;

    renderer.setSize( width, height );
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function handleKeyDown(event) {
    if (event.repeat) {
      return;
    }

    if (audioElement.children.length > 0 && event.key === ' ' && appState.appPaused) {
      action.paused = appState.appPaused = false;
      action.play();
      audioElement.play();
    }
  }

  function handleKeyUp(event) {
    if (event.key === ' ' && !appState.appPaused) {
      action.paused = appState.appPaused = true;
      audioElement.pause();
    }
  }
}
