import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface Particle {
  position: THREE.Vector3
  basePosition: THREE.Vector3
  velocity: THREE.Vector3
  color: THREE.Color
  size: number
  phase: number
}

export default function LilacPointCloud() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Scene setup
    const scene = new THREE.Scene()
    
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    )
    camera.position.z = 8

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
    })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Create lilac flower particle system
    const particleCount = 8000
    const particles: Particle[] = []
    
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)

    // Lilac color palette
    const lilacColors = [
      new THREE.Color('#e8d5f5'), // lightest lavender
      new THREE.Color('#d4b5f0'), // soft lilac
      new THREE.Color('#c9a0e8'), // medium lilac
      new THREE.Color('#b57edc'), // lilac
      new THREE.Color('#9b6fc0'), // deep lilac
      new THREE.Color('#7b4fa0'), // dark purple
      new THREE.Color('#6b3fa0'), // deepest purple
      new THREE.Color('#e0c8f0'), // pinkish lavender
    ]

    // Stem colors (greenish/brown)
    const stemColors = [
      new THREE.Color('#5a7a4a'),
      new THREE.Color('#4a6a3a'),
      new THREE.Color('#6b5b4f'),
      new THREE.Color('#5a4a3a'),
    ]

    // Create multiple lilac panicles (conical flower clusters)
    const panicles = [
      { center: new THREE.Vector3(0, 1.2, 0), scale: 1.0, tilt: 0 },
      { center: new THREE.Vector3(-1.2, 0.4, -0.5), scale: 0.85, tilt: -0.3 },
      { center: new THREE.Vector3(1.1, 0.5, -0.3), scale: 0.8, tilt: 0.25 },
      { center: new THREE.Vector3(-0.6, 1.8, 0.2), scale: 0.7, tilt: -0.15 },
      { center: new THREE.Vector3(0.7, 1.6, 0.3), scale: 0.75, tilt: 0.2 },
      { center: new THREE.Vector3(-1.5, -0.3, -0.8), scale: 0.6, tilt: -0.4 },
      { center: new THREE.Vector3(1.4, -0.1, -0.6), scale: 0.65, tilt: 0.35 },
    ]

    // Stems
    const stemParticleCount = 600
    panicles.forEach((panicle) => {
      const stemBottom = new THREE.Vector3(
        panicle.center.x * 0.3,
        panicle.center.y - panicle.scale * 1.5,
        panicle.center.z
      )
      for (let i = 0; i < stemParticleCount / panicles.length; i++) {
        const t = Math.random()
        const pos = new THREE.Vector3().lerpVectors(stemBottom, panicle.center, t)
        pos.x += (Math.random() - 0.5) * 0.05
        pos.z += (Math.random() - 0.5) * 0.05
        
        const particle: Particle = {
          position: pos.clone(),
          basePosition: pos.clone(),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.002,
            Math.random() * 0.003,
            (Math.random() - 0.5) * 0.002
          ),
          color: stemColors[Math.floor(Math.random() * stemColors.length)],
          size: 0.015 + Math.random() * 0.02,
          phase: Math.random() * Math.PI * 2,
        }
        particles.push(particle)
      }
    })

    // Flower particles - distributed in conical panicle shapes
    const flowerParticleCount = particleCount - stemParticleCount
    const particlesPerPanicle = Math.floor(flowerParticleCount / panicles.length)

    panicles.forEach((panicle, pi) => {
      const count = pi === panicles.length - 1 
        ? flowerParticleCount - particlesPerPanicle * pi 
        : particlesPerPanicle

      for (let i = 0; i < count; i++) {
        // Create panicle shape: narrow at top, wide at bottom
        const heightT = Math.pow(Math.random(), 0.4) // bias toward top
        const radiusAtHeight = (1 - heightT) * panicle.scale * 1.2
        const angle = Math.random() * Math.PI * 2
        const r = Math.pow(Math.random(), 0.5) * radiusAtHeight
        
        // Add clustering for individual flower buds
        const clusterAngle = Math.random() * Math.PI * 2
        const clusterR = Math.random() * 0.15
        const clusterX = Math.cos(clusterAngle) * clusterR
        const clusterZ = Math.sin(clusterAngle) * clusterR

        const pos = new THREE.Vector3(
          panicle.center.x + Math.cos(angle) * r + clusterX,
          panicle.center.y + heightT * panicle.scale * 2.5 + (Math.random() - 0.5) * 0.1,
          panicle.center.z + Math.sin(angle) * r + clusterZ
        )

        // Rotate slightly based on tilt
        if (panicle.tilt !== 0) {
          const tiltY = pos.y - panicle.center.y
          pos.x += tiltY * panicle.tilt * 0.3
        }

        // Color based on height (darker at base, lighter at tips)
        const colorT = heightT * 0.7 + Math.random() * 0.3
        const baseColorIdx = Math.floor(colorT * (lilacColors.length - 2))
        const color1 = lilacColors[baseColorIdx]
        const color2 = lilacColors[baseColorIdx + 1]
        const color = new THREE.Color().copy(color1).lerp(color2, Math.random())

        const particle: Particle = {
          position: pos.clone(),
          basePosition: pos.clone(),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.004,
            Math.random() * 0.005,
            (Math.random() - 0.5) * 0.004
          ),
          color,
          size: 0.02 + Math.random() * 0.04,
          phase: Math.random() * Math.PI * 2,
        }
        particles.push(particle)
      }
    })

    // Background ambient particles (floating around)
    const ambientCount = 500
    for (let i = 0; i < ambientCount; i++) {
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 6 - 1
      )
      const color = lilacColors[Math.floor(Math.random() * 3)]
      const particle: Particle = {
        position: pos.clone(),
        basePosition: pos.clone(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.003,
          Math.random() * 0.004,
          (Math.random() - 0.5) * 0.003
        ),
        color: new THREE.Color().copy(color).multiplyScalar(0.4 + Math.random() * 0.3),
        size: 0.005 + Math.random() * 0.015,
        phase: Math.random() * Math.PI * 2,
      }
      particles.push(particle)
    }

    // Update buffer
    function updateBuffer() {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        positions[i * 3] = p.position.x
        positions[i * 3 + 1] = p.position.y
        positions[i * 3 + 2] = p.position.z
        colors[i * 3] = p.color.r
        colors[i * 3 + 1] = p.color.g
        colors[i * 3 + 2] = p.color.b
        sizes[i] = p.size
      }
    }

    updateBuffer()

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    // Custom shader material for soft glowing particles
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float dist = length(mvPosition.xyz);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_PointSize = clamp(gl_PointSize, 0.5, 8.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Fade particles further away
          vAlpha = 1.0 - smoothstep(3.0, 10.0, dist);
          vAlpha = clamp(vAlpha, 0.3, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          
          // Soft circle gradient
          float alpha = 1.0 - smoothstep(0.0, 0.5, d);
          alpha = pow(alpha, 1.5);
          alpha *= vAlpha;
          
          // Add subtle glow at center
          float glow = exp(-d * 4.0) * 0.5;
          
          gl_FragColor = vec4(vColor, alpha);
          gl_FragColor.rgb += vColor * glow * 0.3;
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    })

    const pointCloud = new THREE.Points(geometry, material)
    scene.add(pointCloud)

    // Mouse interaction
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }

    window.addEventListener('mousemove', handleMouseMove)

    let time = 0

    function animate() {
      const animateId = requestAnimationFrame(animate)

      time += 0.005
      material.uniforms.uTime.value = time

      // Update particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        
        // Gentle breathing motion
        const breathe = Math.sin(time * 0.8 + p.phase) * 0.02
        
        p.position.x = p.basePosition.x + Math.sin(time * 0.6 + p.phase) * 0.03 + breathe * 0.5
        p.position.y = p.basePosition.y + Math.cos(time * 0.7 + p.phase) * 0.025 + breathe * 0.3
        p.position.z = p.basePosition.z + Math.cos(time * 0.5 + p.phase) * 0.02

        // Mouse influence (subtle)
        const dx = p.position.x - mouseRef.current.x * 1.5
        const dy = p.position.y - mouseRef.current.y * 1.5
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 1.5) {
          const force = (1 - dist / 1.5) * 0.005
          p.position.x += dx * force
          p.position.y += dy * force
        }

        // Keep near base
        p.position.x += (p.basePosition.x - p.position.x) * 0.02
        p.position.y += (p.basePosition.y - p.position.y) * 0.02
        p.position.z += (p.basePosition.z - p.position.z) * 0.02

        // Update buffer
        positions[i * 3] = p.position.x
        positions[i * 3 + 1] = p.position.y
        positions[i * 3 + 2] = p.position.z
      }

      geometry.attributes.position.needsUpdate = true

      // Gentle camera rotation
      camera.position.x += (mouseRef.current.x * 0.5 - camera.position.x) * 0.01
      camera.position.y += (-mouseRef.current.y * 0.3 - camera.position.y) * 0.01
      camera.lookAt(0, 0.8, 0)

      renderer.render(scene, camera)
    }

    animate()

    // Resize handler
    const handleResize = () => {
      if (!container) return
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(0)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      container.removeChild(renderer.domElement)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full"
    />
  )
}
