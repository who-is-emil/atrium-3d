import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import GUI from "lil-gui";

export default class Scene {
  constructor(modelPath) {
    this.modelPath = modelPath;
    this.loadingElement = document.querySelector(".loading");

    this.init();
  }

  init() {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    this.time = 0;

    const device = {
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: window.devicePixelRatio,
    };

    this.renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    this.renderer.setPixelRatio(device.pixelRatio);
    this.renderer.setSize(device.width, device.height);
    this.renderer.outputEncoding = THREE.sRGBEncoding;

    const fov = 45;
    const aspect = device.width / device.height;
    const near = 0.1;
    const far = 100;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.lookAt(0, 0, 0);
    this.camera.position.set(10, 10, 25);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    // controls.update();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xeeeeee);

    const ambientLight = new THREE.AmbientLight(0xaaaaaa, 1);
    this.scene.add(ambientLight);

    // const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    // hemiLight.position.set(5, 10, 8);
    // this.scene.add(hemiLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight2.position.set(-5, 10, -7.5);
    this.scene.add(directionalLight2);

    if (this.modelPath) {
      this.loadModel(this.modelPath);
    }

    // this.gui = new GUI();
    // this.colorSettings = {
    //   color: "#ffffff",
    // };
    // this.gui
    //   .addColor(this.colorSettings, "color")
    //   .onChange(this.changeColor.bind(this));

    const toggle = document.querySelector("[data-toggle]");
    if (toggle) {
      toggle.addEventListener("click", () => {
        this.toggleVisibility();
      });
    }

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    canvas.addEventListener("click", this.onClick.bind(this));

    requestAnimationFrame(this.render.bind(this));
  }

  onClick(event) {
    // Нормализуем координаты клика
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Обновляем луч Raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Рисуем луч и находим пересечения с объектами
    const intersects = this.raycaster.intersectObjects(this.scene.children);

    if (intersects.length > 0) {
      const object = intersects[0].object;
      if (object.name === "mesh_64") {
        alert(`Вы кликнули на объект: ${object.name}`);
      }
    }
  }

  toggleVisibility() {
    if (this.model) {
      const targetMesh = this.model.getObjectByName("mesh_58");

      if (targetMesh) {
        targetMesh.visible = !targetMesh.visible;
      }
    }
  }

  loadModel(path) {
    const loader = new GLTFLoader();

    loader.load(
      path,
      (gltf) => {
        this.model = gltf.scene;
        this.scene.add(this.model);
        this.model.scale.set(0.01, 0.01, 0.01);

        const box = new THREE.Box3().setFromObject(this.model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        this.model.position.x -= center.x;
        this.model.position.z -= center.z;
        this.model.position.y -= box.min.y;

        this.model.traverse((node) => {
          if (node.isMesh) {
            console.log(node.name);
            if (
              node.name === "mesh_255" ||
              node.name === "mesh_256" ||
              node.name === "mesh_64" ||
              node.name === "mesh_65" ||
              node.name === "mesh_212"
            ) {
              const newMaterial = new THREE.MeshStandardMaterial({
                color: 0xff0000,
                roughness: 0.5, // или другие параметры
              });

              node.material = newMaterial; // Применяем новый материал
              node.material.needsUpdate = true;
            } else if (node.name === "mesh_58") {
              const newMaterial = new THREE.MeshStandardMaterial({
                color: 0x0000ff,
                roughness: 0.5, // или другие параметры
              });

              node.material = newMaterial; // Применяем новый материал
              node.material.needsUpdate = true;
            } else {
              // node.material.color = new THREE.Color(this.colorSettings.color);
              // node.material.color = new THREE.Color("#ffffff");
              // node.material.needsUpdate = true;
            }
          }
        });

        this.controls.update();
        this.loadingElement.style.display = "none";
      },
      (xhr) => {
        if (xhr.total > 0) {
          const percentComplete = (xhr.loaded / xhr.total) * 100;
          this.loadingElement.innerText = `Загрузка: ${Math.min(100, Math.round(percentComplete))}%`;
        } else {
          this.loadingElement.innerText = "Загрузка...";
        }
      },
      (error) => {
        this.loadingElement.innerText = "Ошибка загрузки!";
      }
    );
  }

  // changeColor(value) {
  //   if (this.model) {
  //     this.model.traverse((node) => {
  //       if (node.isMesh) {
  //         node.material.color.set(value);
  //         node.material.needsUpdate = true;
  //       }
  //     });
  //   }
  // }

  resizeRendererToDisplaySize() {
    const canvas = this.renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;

    if (needResize) {
      this.renderer.setSize(width, height, false);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
    }
  }

  render(time) {
    time *= 0.001;

    this.resizeRendererToDisplaySize();

    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.render.bind(this));
  }
}
