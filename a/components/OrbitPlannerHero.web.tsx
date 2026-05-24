import React, { useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";

type OrbitPlannerHeroProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  buttonLabel: string;
  orbitHint: string;
  onPress: () => void;
};

declare global {
  interface Window {
    THREE?: any;
  }
}

export default function OrbitPlannerHero({
  eyebrow,
  title,
  subtitle,
  buttonLabel,
  orbitHint,
  onPress,
}: OrbitPlannerHeroProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let renderer: any;
    let scene: any;
    let camera: any;
    let frameId = 0;
    let resizeHandler: (() => void) | null = null;
    let disposed = false;

    const ensureThree = async () => {
      if (window.THREE) return window.THREE;

      await new Promise<void>((resolve) => {
        const existing = document.querySelector('script[data-three-cdn="true"]') as HTMLScriptElement | null;
        if (existing) {
          existing.addEventListener("load", () => resolve(), { once: true });
          if ((window as any).THREE) resolve();
          return;
        }

        const script = document.createElement("script");
        script.src = "https://unpkg.com/three@0.160.0/build/three.min.js";
        script.async = true;
        script.dataset.threeCdn = "true";
        script.onload = () => resolve();
        script.onerror = () => resolve();
        document.body.appendChild(script);
      });

      return window.THREE;
    };

    const init = async () => {
      const THREE = await ensureThree();
      const mount = mountRef.current;
      if (!THREE || !mount || disposed) return;

      const width = mount.clientWidth || 320;
      const height = mount.clientHeight || 320;

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 0, 13);

      const ambient = new THREE.AmbientLight(0xffffff, 1.5);
      scene.add(ambient);

      const point = new THREE.PointLight(0xfb923c, 3, 100);
      point.position.set(5, 5, 10);
      scene.add(point);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(4.5, 0.06, 12, 180),
        new THREE.MeshBasicMaterial({ color: 0xfb923c, transparent: true, opacity: 0.4 })
      );
      scene.add(ring);

      const innerGlow = new THREE.Mesh(
        new THREE.SphereGeometry(2.7, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0xfb923c, transparent: true, opacity: 0.08 })
      );
      scene.add(innerGlow);

      const starGeometry = new THREE.BufferGeometry();
      const starCount = 140;
      const positions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount * 3; i += 3) {
        const radius = 6 + Math.random() * 3;
        const angle = Math.random() * Math.PI * 2;
        positions[i] = Math.cos(angle) * radius;
        positions[i + 1] = Math.sin(angle) * radius;
        positions[i + 2] = (Math.random() - 0.5) * 2;
      }
      starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const stars = new THREE.Points(
        starGeometry,
        new THREE.PointsMaterial({ color: 0xffffff, size: 0.07, transparent: true, opacity: 0.75 })
      );
      scene.add(stars);

      const orbitGroup = new THREE.Group();
      const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.35, roughness: 0.45 });

      const fuselage = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.95, 8, 16), planeMaterial);
      fuselage.rotation.z = Math.PI / 2;
      orbitGroup.add(fuselage);

      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.06, 0.28), planeMaterial);
      orbitGroup.add(wing);

      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.2, 0.06), planeMaterial);
      tail.position.set(-0.42, 0.2, 0);
      orbitGroup.add(tail);

      orbitGroup.position.set(4.5, 0, 0);
      scene.add(orbitGroup);

      mount.innerHTML = "";
      mount.appendChild(renderer.domElement);

      const clock = new THREE.Clock();
      const animate = () => {
        if (disposed) return;
        const elapsed = clock.getElapsedTime();
        const orbitAngle = elapsed * 0.9;

        orbitGroup.position.x = Math.cos(orbitAngle) * 4.5;
        orbitGroup.position.y = Math.sin(orbitAngle) * 4.5;
        orbitGroup.rotation.z = orbitAngle + Math.PI / 2;

        ring.rotation.z += 0.0025;
        stars.rotation.z -= 0.0015;
        stars.rotation.x = Math.sin(elapsed * 0.35) * 0.12;
        innerGlow.scale.setScalar(1 + Math.sin(elapsed * 1.8) * 0.05);

        renderer.render(scene, camera);
        frameId = requestAnimationFrame(animate);
      };

      animate();

      resizeHandler = () => {
        if (!renderer || !camera || !mount) return;
        const nextWidth = mount.clientWidth || 320;
        const nextHeight = mount.clientHeight || 320;
        renderer.setSize(nextWidth, nextHeight);
        camera.aspect = nextWidth / nextHeight;
        camera.updateProjectionMatrix();
      };

      window.addEventListener("resize", resizeHandler);
    };

    init();

    return () => {
      disposed = true;
      if (frameId) cancelAnimationFrame(frameId);
      if (resizeHandler) window.removeEventListener("resize", resizeHandler);
      if (renderer) renderer.dispose?.();
      const mount = mountRef.current;
      if (mount) mount.innerHTML = "";
    };
  }, []);

  return (
    <div
      style={{
        background: "#fffaf2",
        borderRadius: 36,
        padding: "28px 24px 30px",
        border: "1px solid #fed7aa",
        boxShadow: "0 12px 24px rgba(124,45,18,0.12)",
        overflow: "hidden",
        marginBottom: 24,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: -30,
          top: -10,
          width: 180,
          height: 180,
          borderRadius: 999,
          background: "radial-gradient(circle, rgba(251,146,60,0.22), rgba(251,146,60,0))",
          pointerEvents: "none",
        }}
      />

      <div style={{ color: "#f97316", fontSize: 11, fontWeight: 900, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
        {orbitHint}
      </div>
      <div style={{ color: "#0f172a", fontSize: 30, lineHeight: "36px", fontWeight: 900, maxWidth: 280 }}>
        {title}
      </div>
      <div style={{ color: "#475569", fontSize: 14, lineHeight: "22px", marginTop: 12, maxWidth: 340 }}>
        {subtitle}
      </div>

      <div style={{ position: "relative", height: 320, marginTop: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          ref={mountRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />

        <button
          onClick={onPress}
          style={{
            position: "relative",
            zIndex: 2,
            width: 210,
            height: 210,
            borderRadius: 999,
            border: "8px solid rgba(255,255,255,0.12)",
            background: "linear-gradient(135deg, #ea580c, #f97316, #fb7185)",
            color: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 18px 28px rgba(234,88,12,0.28)",
            padding: "0 24px",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.18)",
              borderRadius: 999,
              padding: "5px 12px",
              marginBottom: 12,
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 1.2,
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </div>
          <Ionicons name="sparkles" size={34} color="#fff" />
          <div style={{ marginTop: 12, fontSize: 21, lineHeight: "26px", fontWeight: 900, textAlign: "center" }}>
            {buttonLabel}
          </div>
        </button>
      </div>
    </div>
  );
}
