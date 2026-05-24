import React, { useEffect, useRef } from "react";

type MonGoTripLogoProps = {
  subtitle?: string;
};

export default function MonGoTripLogo({ subtitle }: MonGoTripLogoProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let renderer: any;
    let scene: any;
    let camera: any;
    let frameId = 0;
    let disposed = false;

    const init = async () => {
      const THREE = await import("three");
      const mount = mountRef.current;
      if (!mount || disposed) return;

      const width = 52;
      const height = 52;

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(0x000000, 0);

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
      camera.position.z = 6;
      const ambient = new THREE.AmbientLight(0xffffff, 1.4);
      scene.add(ambient);
      const point = new THREE.PointLight(0xffffff, 1.5);
      point.position.set(5, 5, 5);
      scene.add(point);


      const textureLoader = new THREE.TextureLoader();
      // Handle potential require() object structure in different environments
      const logoAsset = require("../assets/logo_square.png");
      const logoUrl = typeof logoAsset === 'string' ? logoAsset : (logoAsset.uri || logoAsset.default || logoAsset);
      
      const logoTexture = textureLoader.load(logoUrl);

      const rotatingLogoFront = new THREE.Mesh(
        new THREE.PlaneGeometry(3.5, 3.5),
        new THREE.MeshBasicMaterial({
          map: logoTexture,
          transparent: true,
        })
      );
      rotatingLogoFront.position.z = 0.01;

      const rotatingLogoBack = new THREE.Mesh(
        new THREE.PlaneGeometry(3.5, 3.5),
        new THREE.MeshBasicMaterial({
          map: logoTexture,
          transparent: true,
        })
      );
      rotatingLogoBack.position.z = -0.01;
      rotatingLogoBack.rotation.y = Math.PI;

      // Middle white card
      const bgPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(3.5, 3.5),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      
      const logoGroup = new THREE.Group();
      logoGroup.add(rotatingLogoFront);
      logoGroup.add(rotatingLogoBack);
      logoGroup.add(bgPlane);
      scene.add(logoGroup);

      mount.innerHTML = "";
      mount.appendChild(renderer.domElement);

      const animate = () => {
        if (disposed) return;
        logoGroup.rotation.y += 0.025;
        renderer.render(scene, camera);
        frameId = requestAnimationFrame(animate);
      };

      animate();
    };

    init();

    return () => {
      disposed = true;
      if (frameId) cancelAnimationFrame(frameId);
      if (renderer) renderer.dispose?.();
      if (mountRef.current) mountRef.current.innerHTML = "";
    };
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 18,
          marginRight: 12,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.16)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div ref={mountRef} style={{ width: 52, height: 52 }} />
      </div>
      <div>
        <div
          style={{
            color: "#ffffff",
            fontSize: 30,
            lineHeight: "30px",
            fontWeight: 900,
            letterSpacing: "-0.8px",
            fontFamily: "ui-sans-serif, system-ui, sans-serif",
          }}
        >
          MonGoTrip
        </div>
        {subtitle ? (
          <div
            style={{
              color: "rgba(255,255,255,0.72)",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              marginTop: 4,
            }}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
    </div>
  );
}
