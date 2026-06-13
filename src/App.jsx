import { useEffect, useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ── CONFIG ── */
const TOTAL_FRAMES = 240
const FRAME_PATH = (i) => `${import.meta.env.BASE_URL}frames/ezgif-frame-${String(i).padStart(3, '0')}.png`

/* ──────────────────────────────────────────────────────────────────
   CUSTOM CURSOR
   ────────────────────────────────────────────────────────────────── */
function CustomCursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)

  useEffect(() => {
    if (window.innerWidth <= 768) return
    const dot = dotRef.current, ring = ringRef.current
    let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0, rafId

    const onMove = (e) => {
      mouseX = e.clientX; mouseY = e.clientY
      gsap.set(dot, { x: mouseX - 4, y: mouseY - 4 })
    }
    const animate = () => {
      ringX += (mouseX - ringX) * 0.15
      ringY += (mouseY - ringY) * 0.15
      gsap.set(ring, { x: ringX - 20, y: ringY - 20 })
      rafId = requestAnimationFrame(animate)
    }
    document.addEventListener('mousemove', onMove)
    rafId = requestAnimationFrame(animate)

    const addHover = () => {
      document.querySelectorAll('button, a, .skill-slot, .quest-card, .archive-slate, .mission-card').forEach(el => {
        el.addEventListener('mouseenter', () => ring.classList.add('hovering'))
        el.addEventListener('mouseleave', () => ring.classList.remove('hovering'))
      })
    }
    setTimeout(addHover, 1000)

    return () => { document.removeEventListener('mousemove', onMove); cancelAnimationFrame(rafId) }
  }, [])

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  )
}

/* ──────────────────────────────────────────────────────────────────
   AMBIENT SOUND SYSTEM
   ────────────────────────────────────────────────────────────────── */
function useAmbientSound() {
  const audioCtxRef = useRef(null)
  const songRef = useRef(null)
  const [muted, setMuted] = useState(false) // Default to sound on
  const mutedRef = useRef(false)
  const nodesRef = useRef({})

  const initAudio = useCallback(() => {
    if (audioCtxRef.current) return
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    audioCtxRef.current = ctx
    const masterGain = ctx.createGain()
    masterGain.gain.value = 0.5 // Setting volume
    masterGain.connect(ctx.destination)

    // Load user's provided song
    const song = new Audio(`${import.meta.env.BASE_URL}Song.mp3`)
    song.loop = true
    song.crossOrigin = "anonymous"
    const songSource = ctx.createMediaElementSource(song)
    songSource.connect(masterGain)
    songRef.current = song

    song.play().catch(e => {
      console.warn("Browser blocked autoplay, waiting for interaction:", e)
      // Do not force muted to true permanently; let startInteraction handle it.
    })

    nodesRef.current = { masterGain }
    setMuted(mutedRef.current)
  }, [])

  // Auto-play on first interaction to bypass browser policies
  useEffect(() => {
    const startInteraction = () => {
      if (!audioCtxRef.current) {
        initAudio()
      } else if (audioCtxRef.current.state === 'suspended' || mutedRef.current) {
        audioCtxRef.current.resume()
        songRef.current?.play().catch(e => console.warn(e))
        setMuted(false)
        mutedRef.current = false
      }
      window.removeEventListener('keydown', startInteraction)
      window.removeEventListener('click', startInteraction)
    }
    
    window.addEventListener('keydown', startInteraction)
    window.addEventListener('click', startInteraction)
    
    return () => {
      window.removeEventListener('keydown', startInteraction)
      window.removeEventListener('click', startInteraction)
    }
  }, [initAudio])

  const forceStartAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      initAudio()
    } else if (audioCtxRef.current.state === 'suspended' || mutedRef.current) {
      audioCtxRef.current.resume()
      songRef.current?.play().catch(e => console.warn(e))
      setMuted(false)
      mutedRef.current = false
    }
  }, [initAudio])

  const toggle = useCallback(() => {
    if (!audioCtxRef.current) {
      initAudio()
      // If we are toggling it manually right away, we want it muted since default is unmuted
      if (mutedRef.current === false) {
          mutedRef.current = true; setMuted(true);
      }
      return
    }
    const ctx = audioCtxRef.current
    const { masterGain } = nodesRef.current
    
    // If currently muted, un-mute it
    if (mutedRef.current) {
      if (ctx.state === 'suspended') ctx.resume()
      songRef.current?.play()
      gsap.to(masterGain.gain, { value: 0.5, duration: 0.5 })
      setMuted(false)
      mutedRef.current = false
    } 
    // If currently playing, mute it
    else {
      gsap.to(masterGain.gain, { value: 0, duration: 0.5, onComplete: () => {
        songRef.current?.pause()
      }})
      setMuted(true)
      mutedRef.current = true
    }
  }, [initAudio])

  const playWhoosh = useCallback(() => {
    if (!audioCtxRef.current) return
    const ctx = audioCtxRef.current
    const osc = ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = 200
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.08, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.setValueAtTime(2000, ctx.currentTime)
    f.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.6)
    osc.connect(f).connect(g).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.7)
  }, [])

  const playUIHover = useCallback(() => {
    if (!audioCtxRef.current) return
    const ctx = audioCtxRef.current
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = 800
    const g = ctx.createGain()
    g.gain.setValueAtTime(0.02, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
    osc.connect(g).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.15)
  }, [])

  const playPageFlip = useCallback(() => {
    const sound = new Audio(`${import.meta.env.BASE_URL}PageSound.mp3`)
    sound.volume = 0.5
    sound.play().catch(e => console.warn(e))
  }, [])

  const guitarSounds = useRef({})
  useEffect(() => {
    const notesToLoad = ['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5']
    notesToLoad.forEach(note => {
      const audio = new Audio(`${import.meta.env.BASE_URL}${note}.wav`)
      audio.preload = "auto"
      guitarSounds.current[note] = audio
    })
  }, [])

  const sequenceIndex = useRef(0)
  const melodyPattern = [
    'E5', 'E5', 'D5', 'C5', 'B4', 'A4', 
    'C5', 'C5', 'B4', 'A4', 'G4', 'F4', 
    'A4', 'A4', 'G4', 'F4', 'E4', 'D4', 
    'F4', 'F4', 'E4', 'D4', 'C4', 'B3', 'A3'
  ]

  const playGuitarString = useCallback(() => {
    const note = melodyPattern[sequenceIndex.current % melodyPattern.length]
    const sound = guitarSounds.current[note]
    if (sound) {
      sound.currentTime = 0
      sound.volume = 0.7
      sound.play().catch(e => console.warn(e))
    }
    sequenceIndex.current++
  }, [])

  return { muted, toggle, playWhoosh, playUIHover, playPageFlip, playGuitarString, forceStartAudio }
}

/* ──────────────────────────────────────────────────────────────────
   CINEMATIC LOADER
   ────────────────────────────────────────────────────────────────── */
function CinematicLoader({ onComplete }) {
  const containerRef = useRef(null)
  const [frame, setFrame] = useState(100)

  useEffect(() => {
    if (frame >= 192) {
      gsap.to(containerRef.current, { opacity: 0, duration: 1, ease: 'power2.inOut', onComplete })
    }
  }, [frame, onComplete])

  useEffect(() => {
    const totalFrames = 192
    const interval = setInterval(() => {
      setFrame(f => (f < totalFrames ? f + 1 : f))
    }, 1000 / 24)
    return () => clearInterval(interval)
  }, [])

  return (
    <div ref={containerRef} className="loader-container">
      <img src={`${import.meta.env.BASE_URL}LoadingScreen/ezgif-frame-${String(frame).padStart(3, '0')}.png`} className="loader-sequence-img" alt="Loading Sequence" />
      <div className="loader-logo ancient-font" style={{ position: 'absolute', zIndex: 10 }}>Loading...</div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────
   ASSET LOADER INDICATOR
   ────────────────────────────────────────────────────────────────── */
function AssetLoaderIndicator({ loaded, total }) {
  const [opacity, setOpacity] = useState(1);
  
  useEffect(() => {
    if (loaded >= total && total > 0) {
      const t = setTimeout(() => setOpacity(0), 3000);
      return () => clearTimeout(t);
    }
  }, [loaded, total]);

  if (opacity === 0) return null;

  return (
    <div className="asset-loader-indicator" style={{
      opacity: opacity,
      transition: 'opacity 1s ease'
    }}>
      <div className="loader-indicator-title">
        Loading Assets: {loaded} / {total}
      </div>
      <div className="loader-indicator-subtitle">
        Synchronizing environment assets... Please wait for optimal immersion.
      </div>
      <div className="loader-indicator-bar-bg">
        <div className="loader-indicator-bar-fill" style={{ width: `${(loaded / total) * 100}%` }} />
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────
   FLOATING ARTIFACTS
   ────────────────────────────────────────────────────────────────── */
function FloatingItems() {
  const containerRef = useRef(null)
  
  useEffect(() => {
    const items = gsap.utils.toArray('.floating-item')

    const float = (item, dirX = null, dirY = null) => {
      if (item.classList.contains('is-repelled')) return;
      
      let targetX, targetY, floatDuration;
      const currentX = gsap.getProperty(item, "x") || 0;
      const currentY = gsap.getProperty(item, "y") || 0;
      
      const w = window.innerWidth;
      const h = window.innerHeight;
      
      // Check if item is significantly off-screen
      const isOffScreen = currentX < -100 || currentX > w + 100 || currentY < -100 || currentY > h + 100;

      if (dirX !== null && dirY !== null) {
        // Continue floating in the pushed direction
        const mag = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
        const driftDistance = 800 + Math.random() * 600; 
        
        targetX = currentX + (dirX / mag) * driftDistance;
        targetY = currentY + (dirY / mag) * driftDistance;
        floatDuration = 4 + Math.random() * 3; // Drift quickly off-screen
      } else {
        // Random natural floating
        targetX = (Math.random() - 0.1) * w * 1.1;
        targetY = (Math.random() - 0.1) * h * 1.1;
        
        if (isOffScreen) {
          // If it's off-screen, return to the screen area quickly
          targetX = w / 2 + (Math.random() - 0.5) * w * 0.6;
          targetY = h / 2 + (Math.random() - 0.5) * h * 0.6;
          floatDuration = 4 + Math.random() * 3; // Hurry back (4-7 seconds)
        } else {
          floatDuration = 15 + Math.random() * 15; // Normal lazy float (15-30 seconds)
        }
      }

      gsap.to(item, {
        x: targetX,
        y: targetY,
        rotation: `+=${(Math.random() - 0.5) * 180}`,
        duration: floatDuration,
        ease: "none",
        onComplete: () => float(item) // Reverts to natural floating next cycle
      })
    }

    items.forEach(item => {
      // Random initial placement
      gsap.set(item, {
        x: () => Math.random() * window.innerWidth,
        y: () => Math.random() * window.innerHeight,
        rotation: () => Math.random() * 360,
        scale: () => 0.4 + Math.random() * 0.6
      })
      float(item)
    })

    // Hover repulsion effect
    const onMouseMove = (e) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      const repelDistance = 250; // Distance threshold for repulsion
      
      items.forEach(item => {
        const rect = item.getBoundingClientRect();
        const itemX = rect.left + rect.width / 2;
        const itemY = rect.top + rect.height / 2;

        const dx = itemX - mouseX;
        const dy = itemY - mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < repelDistance) {
          // Calculate push strength based on proximity
          const pushFactor = Math.pow((repelDistance - distance) / repelDistance, 1.5);
          const pushX = (dx / distance) * pushFactor * 400; // Increased push distance
          const pushY = (dy / distance) * pushFactor * 400; // Increased push distance
          
          item.classList.add('is-repelled');
          gsap.killTweensOf(item);
          
          const currentX = gsap.getProperty(item, "x");
          const currentY = gsap.getProperty(item, "y");

          gsap.to(item, {
            x: currentX + pushX,
            y: currentY + pushY,
            rotation: `+=${(Math.random() - 0.5) * 120}`,
            duration: 0.5, // Reduced duration for faster push
            ease: "power2.out",
            onComplete: () => {
              item.classList.remove('is-repelled');
              // Pass the push vector to continue drifting in that direction
              float(item, pushX, pushY);
            }
          });
        }
      });
    };

    window.addEventListener('mousemove', onMouseMove);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
    }
  }, [])

  const ITEM_COUNT = 8
  const items = Array.from({ length: ITEM_COUNT }, (_, i) => i + 1)

  return (
    <div ref={containerRef} className="floating-items-container">
      {items.map(i => (
        <img 
          key={i} 
          src={`${import.meta.env.BASE_URL}Items/item-${i}.png`} 
          className="floating-item" 
          alt={`Floating artifact ${i}`} 
          onError={(e) => {
            // Bulletproof fallback in case local dev server cached the original file names
            if (e.target.src.includes('item-')) {
              e.target.src = `${import.meta.env.BASE_URL}Items/Item ${i}.png`;
            }
          }}
        />
      ))}
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────
   GLOBAL 3D CANVAS BACKGROUND
   ────────────────────────────────────────────────────────────────── */
function GlobalBackground({ onTransition, onProgress }) {
  const canvasRef = useRef(null)
  const currentFrameRef = useRef(0)
  const onTransitionRef = useRef(onTransition)
  const onProgressRef = useRef(onProgress)

  useEffect(() => {
    onTransitionRef.current = onTransition
  }, [onTransition])

  useEffect(() => {
    onProgressRef.current = onProgress
  }, [onProgress])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { alpha: false })
    const images = []
    let loadedCount = 0

    const setCanvasSize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio
      canvas.height = window.innerHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    setCanvasSize()
    window.addEventListener('resize', setCanvasSize)

    const drawFrame = (index) => {
      const img = images[index]
      if (!img || !img.complete) return
      
      const cW = canvas.width / window.devicePixelRatio
      const cH = canvas.height / window.devicePixelRatio
      const imgRatio = img.naturalWidth / img.naturalHeight
      const canvasRatio = cW / cH
      
      let drawW, drawH, drawX, drawY
      if (canvasRatio > imgRatio) {
        drawW = cW; drawH = cW / imgRatio
        drawX = 0; drawY = (cH - drawH) / 2
      } else {
        drawH = cH; drawW = cH * imgRatio
        drawX = (cW - drawW) / 2; drawY = 0
      }
      
      ctx.drawImage(img, drawX, drawY, drawW, drawH)
    }

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image()
      img.src = FRAME_PATH(i)
      img.onload = () => {
        loadedCount++
        if (onProgressRef.current && (loadedCount % 5 === 0 || loadedCount === TOTAL_FRAMES)) {
          onProgressRef.current(loadedCount)
        }
        if (loadedCount === 1) drawFrame(0)
      }
      images.push(img)
    }

    const obj = { frame: 0 }
    let st;
    
    setTimeout(() => {
      st = ScrollTrigger.create({
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.5,
        animation: gsap.to(obj, {
          frame: TOTAL_FRAMES - 1,
          snap: 'frame',
          ease: 'none',
          onUpdate: () => {
            const frameIndex = Math.round(obj.frame)
            if (frameIndex !== currentFrameRef.current) {
              currentFrameRef.current = frameIndex
              drawFrame(frameIndex)
              const transitionPoints = [60, 120, 180]
              if (transitionPoints.includes(frameIndex) && onTransitionRef.current) {
                onTransitionRef.current()
              }
            }
          }
        })
      })
    }, 100)

    return () => {
      window.removeEventListener('resize', setCanvasSize)
      if (st) st.kill()
    }
  }, [])

  return (
    <div className="global-canvas-container">
      <canvas ref={canvasRef} className="global-canvas" />
      <div className="dark-overlay" />
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────
   CONTENT SECTIONS
   ────────────────────────────────────────────────────────────────── */

function HeroSection({ playGuitarString }) {
  const sectionRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.5 })
      // Magical emerge for hero elements
      tl.from('.hero-subtitle', { opacity: 0, y: 30, filter: 'blur(10px)', duration: 1.2, ease: 'power3.out' })
        .from('.hero-title', { opacity: 0, scale: 1.2, filter: 'blur(20px)', duration: 2, ease: 'power2.out' }, '-=0.8')
        .from('.hero-desc', { opacity: 0, y: 20, filter: 'blur(5px)', duration: 1, ease: 'power3.out' }, '-=1.2')
        .from('.hero-line', { width: 0, duration: 1, ease: 'power2.out' }, '-=0.8')
        .from('.hero-cta', { opacity: 0, y: 20, duration: 0.8, ease: 'power3.out' }, '-=0.6')

      gsap.to(sectionRef.current, {
        opacity: 0, y: -100,
        scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: 'bottom top', scrub: true }
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  const nameLetters = "Shivam Rai".split("")

  return (
    <section ref={sectionRef} className="hero">
      <div className="hero-content">
        <div className="hero-subtitle">Environment Artist & Game Developer</div>
        <h1 className="hero-title">
          <span className="name-gradient">
            {nameLetters.map((char, i) => (
              <span 
                key={i} 
                className="hover-char"
                onMouseEnter={() => playGuitarString && char !== " " && playGuitarString()}
              >
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
          </span>
        </h1>
        <p className="hero-desc" style={{ color: 'var(--color-text-dim)', maxWidth: '600px', fontSize: '1.1rem', marginTop: '-1rem' }}>
          Specializing in Unreal Engine 5, real-time world building, cinematic storytelling, and immersive visual design.
        </p>
        <div className="hero-line" />
        <button className="hero-cta" onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}>
          <span className="btn-text">Initialize Sequence</span>
        </button>
      </div>
      <div className="hero-scroll-indicator">
        <div className="scroll-arrow" />
        <div className="scroll-text">Scroll to explore</div>
      </div>
    </section>
  )
}

function ChapterText({ chapter, title, desc }) {
  const ref = useRef(null)
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      const el = ref.current.querySelector('.chapter-block')
      
      // Removed the 'scrub' approach because it was causing visibility bugs based on scrolling height.
      // Now using a reliable one-shot triggered animation.
      gsap.from(el, {
        opacity: 0,
        y: 100,
        filter: 'blur(15px)',
        scale: 0.9,
        duration: 1.5,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 75%', // triggers when the top of the chapter reaches 75% down the screen
          toggleActions: 'play reverse play reverse'
        }
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={ref} className="text-chapter-section">
      <div className="chapter-block" style={{ willChange: 'transform, opacity, filter' }}>
        <div className="section-label">// {chapter}</div>
        <h2>{title}</h2>
        <p>{desc}</p>
      </div>
    </section>
  )
}

/* ── THE SKILL TREE ── */
const SKILL_DATA = [
  {
    category: "Game Development & Environments",
    items: [
      { name: "Unreal Engine 5", level: 95, icon: "🎮" },
      { name: "Real-Time Rendering", level: 90, icon: "⚡" },
      { name: "Cinematics", level: 95, icon: "🎬" },
      { name: "Lighting & Atmosphere", level: 90, icon: "☀️" },
      { name: "Material Blending", level: 85, icon: "🎨" },
      { name: "Procedural Workflows", level: 80, icon: "🔄" }
    ]
  },
  {
    category: "Technical & Tools",
    items: [
      { name: "Blueprints", level: 85, icon: "⚙️" },
      { name: "Blender", level: 70, icon: "🧊" },
      { name: "Figma", level: 85, icon: "📐" },
      { name: "Illustrator", level: 80, icon: "🖋️" }
    ]
  },
  {
    category: "Web & UX",
    items: [
      { name: "React", level: 70, icon: "⚛️" },
      { name: "JavaScript", level: 80, icon: "📜" },
      { name: "HTML / CSS", level: 90, icon: "🌐" },
      { name: "UX Design", level: 85, icon: "🧠" }
    ]
  }
];

function SkillTree({ playHover }) {
  const ref = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Fade in the header
      gsap.from('.section-header.skill-header', {
        opacity: 0, y: 30, scrollTrigger: { trigger: ref.current, start: 'top 70%', toggleActions: 'play none none reverse' }
      })
      
      // Fade in the category titles
      gsap.from('.skill-category-title', {
        opacity: 0, x: -30, duration: 0.8, stagger: 0.3,
        scrollTrigger: { trigger: ref.current, start: 'top 60%', toggleActions: 'play none none reverse' }
      })

      // The Magic Floating Assembly!
      const slots = gsap.utils.toArray('.skill-slot')
      
      // 1. Scatter them randomly around the screen (invisible)
      slots.forEach(slot => {
        gsap.set(slot, {
          x: () => gsap.utils.random(-800, 800),
          y: () => gsap.utils.random(-800, 800),
          z: () => gsap.utils.random(-500, 500),
          rotationX: () => gsap.utils.random(-180, 180),
          rotationY: () => gsap.utils.random(-180, 180),
          rotationZ: () => gsap.utils.random(-180, 180),
          scale: () => gsap.utils.random(0.1, 2.5),
          opacity: 0
        })
      })

      gsap.to(slots, {
        x: 0, y: 0, z: 0,
        rotationX: 0, rotationY: 0, rotationZ: 0,
        scale: 1, opacity: 1,
        ease: "power2.out",
        stagger: { amount: 0.5, from: "random" },
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 50%', // Wait until the top of the section reaches the middle of the screen
          end: 'center 40%', // Finish the assembly when the center of the section reaches 40% from top
          scrub: 1.5
        }
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={ref} className="skill-tree-section" style={{ perspective: '1000px' }}>
      <div className="section-header skill-header">
        <div className="section-label">// Skill Tree</div>
        <h2>Arsenal & Abilities</h2>
      </div>
      
      {SKILL_DATA.map((cat, idx) => (
        <div key={idx} className="skill-category-container">
          <div className="skill-category-title">{cat.category}</div>
          <div className="skill-grid" style={{ transformStyle: 'preserve-3d' }}>
            {cat.items.map((skill, sIdx) => (
              <div className="skill-slot" key={sIdx} onMouseEnter={playHover} title={`Proficiency: ${skill.level}%`}>
                <div className="skill-icon">{skill.icon}</div>
                <div className="skill-name">{skill.name}</div>
                <div className="skill-level-bar" style={{ width: `${skill.level}%` }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}



/* ── MISSIONS SHOWCASE (UE5 PROJECTS) ── */
const MISSIONS = [
  { number: 'Mission 01', title: 'Procedural Growth Animation', desc: 'Real-time organic growth animation over a classical sculpture using material blending techniques to simulate natural transformation.', tags: ['Unreal Engine 5', 'Procedural Workflow', 'Material Blending'] },
  { number: 'Mission 02', title: 'Desert Oasis Environment', desc: 'High-contrast desert scene studying sunlight behavior, shadows, and color temperature. Balanced warm sand tones with reflective water elements.', tags: ['Unreal Engine 5', 'Lighting', 'Environment Design'] },
  { number: 'Mission 03', title: 'Cinematic Mountain Lake', desc: 'Immersive natural environment emphasizing reflections, lighting, and depth layering. Crafted a calm, atmospheric scene using foreground elements.', tags: ['Unreal Engine 5', 'Cinematics', 'World Building'] },
  { number: 'Mission 04', title: 'GTA VI Concept Experience', desc: 'Designed a cinematic promotional experience inspired by AAA game launches using bold layouts and interactive storytelling elements.', tags: ['UX/UI', 'Web', 'Interactive Design'] },
]

function MissionsShowcase({ playHover }) {
  const sectionRef = useRef(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.missions-header', {
        opacity: 0, y: 40, duration: 0.8,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 70%', toggleActions: 'play none none reverse' }
      })
      gsap.utils.toArray('.mission-card').forEach((card, i) => {
        gsap.from(card, {
          opacity: 0, y: 50, rotationY: 15, duration: 0.8, delay: i * 0.2,
          scrollTrigger: { trigger: '.missions-grid', start: 'top 80%', toggleActions: 'play none none reverse' }
        })
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  const handleMouseEnter = (i) => {
    playHover();
    const card = document.getElementById(`mission-card-${i}`);
    if (card) {
      // Bring to front, scale up, move up
      gsap.to(card, { scale: 1.15, y: -40, zIndex: 100, duration: 0.4, ease: 'back.out(1.5)' });
    }
  }

  const handleMouseMove = (e, i) => {
    const card = document.getElementById(`mission-card-${i}`)
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    // Dynamic 3D tilt effect on hover
    const rotateX = ((y - centerY) / centerY) * -15
    const rotateY = ((x - centerX) / centerX) * 15
    gsap.to(card, { rotateX, rotateY, duration: 0.1, ease: 'none' })
  }

  const handleMouseLeave = (i) => {
    const card = document.getElementById(`mission-card-${i}`)
    if (!card) return
    // Revert tilt and scale, return to original z-index
    gsap.to(card, { rotateX: 0, rotateY: 0, scale: 1, y: 0, zIndex: i, duration: 0.6, ease: 'power2.out' })
  }

  return (
    <section ref={sectionRef} className="missions-section" style={{ padding: '6rem 8%', minHeight: '100vh', perspective: '1500px' }}>
      <div className="section-header missions-header">
        <div className="section-label">// Operations</div>
        <h2>Project Archives</h2>
      </div>
      <div className="missions-grid">
        {MISSIONS.map((m, i) => (
          <div className="mission-card-wrapper" key={i}>
            <div 
              className="mission-card" 
              id={`mission-card-${i}`}
              style={{ zIndex: i }}
              onMouseEnter={() => handleMouseEnter(i)}
              onMouseMove={(e) => handleMouseMove(e, i)}
              onMouseLeave={() => handleMouseLeave(i)}
            >
              <img src={`${import.meta.env.BASE_URL}pages/Page1.png`} alt="Project Page" className="mission-page-img" />
              
              <div className="mission-content">
                <div className="mission-number">{m.number}</div>
                <h3 className="mission-title">{m.title}</h3>
                <p className="mission-desc">{m.desc}</p>
                <div className="mission-tags">
                  {m.tags.map(t => <span className="mission-tag" key={t}>{t}</span>)}
                </div>
              </div>

              <div className="mission-hover-prompt">Let's do it!</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── THE JOURNEY (EDUCATION MAP) ── */
const EDUCATION_NODES = [
  { id: 1, year: '2018', title: 'Secondary Education', issuer: 'Shri Guru Ram Rai Public School', x: 71.5, y: 78.5 },
  { id: 2, year: '2020', title: 'Senior Secondary', issuer: 'Oceanic International School', x: 79, y: 65 },
  { id: 3, year: '2020 - 2023', title: 'Bachelor of Computer Applications', issuer: 'Graphic Era University', x: 79.3, y: 50 },
  { id: 4, year: '2024 - 2026', title: 'Junior UX Designer', issuer: 'Wipro Limited', x: 61, y: 51 },
  { id: 5, year: '2026 - Present', title: 'Game Developer', issuer: 'Free Lance', x: 59, y: 38 },
  { id: 6, year: 'Needs to be Unlocked', title: 'Game Developer', issuer: 'XXXXX', x: 50, y: 53.5 }
]

function EducationMap({ playHover }) {
  const ref = useRef(null)
  const pathRef = useRef(null)

  const pathData = EDUCATION_NODES.reduce((acc, node, i, arr) => {
    if (i === 0) return `M ${node.x} ${node.y}`;
    const prev = arr[i - 1];
    // Create a smooth winding curve to look like a natural trail
    const isEven = i % 2 === 0;
    const curveOffset = isEven ? 8 : -8; // Adds a natural "snake" bend to the path
    const cp1x = prev.x + (node.x - prev.x) / 3 + curveOffset;
    const cp1y = prev.y + (node.y - prev.y) / 3 - curveOffset;
    const cp2x = prev.x + 2 * (node.x - prev.x) / 3 - curveOffset;
    const cp2y = prev.y + 2 * (node.y - prev.y) / 3 + curveOffset;
    
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${node.x} ${node.y}`;
  }, "");

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.map-header', {
        opacity: 0, y: 30, scrollTrigger: { trigger: ref.current, start: 'top 70%', toggleActions: 'play none none reverse' }
      })
      gsap.from('.map-container', {
        opacity: 0, scale: 0.95, duration: 1, scrollTrigger: { trigger: ref.current, start: 'top 60%', toggleActions: 'play none none reverse' }
      })

      if (pathRef.current) {
        const length = pathRef.current.getTotalLength()
        gsap.set(pathRef.current, { strokeDasharray: length, strokeDashoffset: length })
        gsap.to(pathRef.current, {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: { trigger: '.map-container', start: 'top 60%', end: 'bottom 40%', scrub: 1 }
        })
      }

      gsap.utils.toArray('.map-node').forEach((node, i) => {
        gsap.from(node, {
          opacity: 0, scale: 0, delay: i * 0.3, duration: 0.6, ease: "back.out(1.5)",
          scrollTrigger: { trigger: '.map-image-wrapper', start: 'top 60%', toggleActions: 'play none none reverse' }
        })
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  const handleMouseMove = (e) => {
    const mapWrapper = document.getElementById('map-wrapper-3d')
    if (!mapWrapper) return
    const rect = mapWrapper.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * -5 // Subtle 5 deg tilt
    const rotateY = ((x - centerX) / centerX) * 5
    gsap.to(mapWrapper, { rotateX, rotateY, duration: 0.1, ease: 'none' })
  }

  const handleMouseLeave = () => {
    const mapWrapper = document.getElementById('map-wrapper-3d')
    if (!mapWrapper) return
    gsap.to(mapWrapper, { rotateX: 0, rotateY: 0, duration: 0.7, ease: 'power2.out' })
  }

  return (
    <section ref={ref} className="map-section">
      <div className="section-header map-header">
        <div className="section-label">// The Journey</div>
        <h2 style={{ color: 'var(--color-accent-gold)' }}>Education & Origins</h2>
      </div>
      
      <div className="map-float-container">
        <div 
          id="map-wrapper-3d" 
          className="map-image-wrapper"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <img src={`${import.meta.env.BASE_URL}custom_map.png`} alt="Journey Map" className="map-image" />
          
          <svg className="map-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path className="map-path-base" d={pathData} />
            <path ref={pathRef} className="map-path-active" d={pathData} />
          </svg>

          {EDUCATION_NODES.map((node) => (
            <div className="map-node" key={node.id} style={{ left: `${node.x}%`, top: `${node.y}%` }} onMouseEnter={playHover}>
              <div className="map-marker" />
              <div className="map-tooltip">
                <div className="map-year">{node.year}</div>
                <div className="map-title">{node.title}</div>
                <div className="map-issuer">{node.issuer}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── THE ARCHIVES (CERTIFICATIONS) ── */
const LORE = [
  { title: "UE5 – Environment Art for 3D Video Games", issuer: "Udemy", type: "Certification", year: "Recent" },
  { title: "Google UX Design Professional Certificate", issuer: "Coursera", type: "Certification", year: "Recent" },
  { title: "Complete React & NextJS Course", issuer: "Udemy", type: "Certification", year: "Recent" },
  { title: "The Complete AI Guide: Generative AI & ChatGPT", issuer: "Udemy", type: "Certification", year: "Recent" }
];

function Archives({ playHover }) {
  const ref = useRef(null)
  const floatTweens = useRef([])

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.archives-header', {
        opacity: 0, y: 30, scrollTrigger: { trigger: ref.current, start: 'top 70%', toggleActions: 'play none none reverse' }
      })

      const wrappers = gsap.utils.toArray('.archive-card-wrapper')
      
      wrappers.forEach(wrapper => {
        gsap.set(wrapper, {
          x: () => gsap.utils.random(-800, 800),
          y: () => gsap.utils.random(-800, 800),
          z: () => gsap.utils.random(-500, 500),
          rotationX: () => gsap.utils.random(-180, 180),
          rotationY: () => gsap.utils.random(-180, 180),
          rotationZ: () => gsap.utils.random(-180, 180),
          scale: () => gsap.utils.random(0.1, 2.5),
          opacity: 0
        })
      })

      gsap.to(wrappers, {
        x: 0, y: 0, z: 0,
        rotationX: 0, rotationY: 0, rotationZ: 0,
        scale: 1, opacity: 1,
        ease: "power2.out",
        stagger: { amount: 0.5, from: "random" },
        scrollTrigger: {
          trigger: ref.current,
          start: 'top 50%',
          end: 'center 40%',
          scrub: 1.5
        }
      })

      const slates = gsap.utils.toArray('.archive-slate')
      slates.forEach((slate, i) => {
        const tween = gsap.to(slate, {
          y: () => "+=" + (Math.random() * 20 + 10),
          x: () => "+=" + (Math.random() * 10 + 5),
          rotationZ: () => "+=" + (Math.random() * 6 - 3),
          rotationX: () => "+=" + (Math.random() * 15 - 7.5),
          rotationY: () => "+=" + (Math.random() * 15 - 7.5),
          duration: () => 3 + Math.random() * 2,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
          delay: i * 0.2
        })
        floatTweens.current[i] = tween
      })

    }, ref)
    return () => ctx.revert()
  }, [])

  const handleMouseEnter = (i) => {
    if (playHover) playHover();
    if (floatTweens.current[i]) floatTweens.current[i].pause();
    
    const wrapper = document.getElementById(`archive-wrapper-${i}`);
    if (wrapper) wrapper.style.zIndex = 100;
    
    const card = document.getElementById(`archive-card-${i}`);
    if (card) {
      gsap.to(card, {
        scale: 1.15,
        rotationZ: 0,
        rotationX: 0,
        rotationY: 0,
        x: 0,
        y: 0,
        duration: 0.4,
        ease: 'back.out(1.5)'
      });
    }
  }

  const handleMouseLeave = (i) => {
    const wrapper = document.getElementById(`archive-wrapper-${i}`);
    if (wrapper) wrapper.style.zIndex = 1;
    
    const card = document.getElementById(`archive-card-${i}`);
    if (card) {
      gsap.to(card, {
        scale: 1,
        duration: 0.5,
        ease: 'power2.out',
        onComplete: () => {
          if (floatTweens.current[i]) floatTweens.current[i].play();
        }
      });
    }
  }

  return (
    <section ref={ref} className="archives-section">
      <div className="section-header archives-header">
        <div className="section-label">// The Archives</div>
        <h2 style={{ color: 'var(--color-accent-alt)' }}>Unlocked Lore</h2>
      </div>
      <div className="archives-grid">
        {LORE.map((lore, i) => (
          <div className="archive-card-wrapper" id={`archive-wrapper-${i}`} key={i} style={{ zIndex: 1, position: 'relative' }}>
            <div 
              className="archive-slate" 
              id={`archive-card-${i}`}
              onMouseEnter={() => handleMouseEnter(i)}
              onMouseLeave={() => handleMouseLeave(i)}
            >
              <img src={`${import.meta.env.BASE_URL}pages/Page2.png`} alt="Lore Page" className="archive-page-img" />
              <div className="archive-content">
                <div className="archive-type">{lore.type} // {lore.year}</div>
                <div className="archive-title">{lore.title}</div>
                <div className="archive-issuer">{lore.issuer}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ── SUMMONING PORTAL (CONTACT) ── */
const SummoningPortal = ({ onNavigate }) => {
  const ref = useRef(null)
  const scrollRef = useRef(null)
  
  // Magical Effects State
  const [parallaxStyle, setParallaxStyle] = useState({ transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)' })
  const [isSealed, setIsSealed] = useState(false)

  const handleMouseMove = (e) => {
    if (!scrollRef.current) return
    const rect = scrollRef.current.getBoundingClientRect()
    // Calculate normalized position (-0.5 to 0.5)
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    
    // Smooth, subtle 3D tilt
    setParallaxStyle({
      transform: `perspective(1000px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg)`
    })
  }

  const handleMouseLeave = () => {
    setParallaxStyle({ transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg)' })
  }

  const handleSealAndSend = (e) => {
    e.preventDefault()
    setIsSealed(true)
  }

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.scroll-container', {
        opacity: 0, scale: 0.9, y: 50, duration: 1,
        scrollTrigger: { trigger: ref.current, start: 'top 70%', toggleActions: 'play none none reverse' }
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={ref} className="portal-section">
      <div 
        className="scroll-container" 
        ref={scrollRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="scroll-content-wrapper" style={parallaxStyle}>
          {!isSealed ? (
            <>
              <div className="scroll-header">
                <div className="scroll-title">Magical World Of Shivu</div>
                <div className="scroll-status">~ Send a message via Owl ~</div>
              </div>
              <form className="scroll-form" onSubmit={handleSealAndSend}>
                <div className="scroll-input-group">
                  <label className="scroll-label">Mage's Identity (Name)</label>
                  <input type="text" className="scroll-input" placeholder="Your name..." required />
                </div>
                <div className="scroll-input-group">
                  <label className="scroll-label">Aura Frequency (Email)</label>
                  <input type="email" className="scroll-input" placeholder="Your email..." required />
                </div>
                <div className="scroll-input-group">
                  <label className="scroll-label">Incantation (Message)</label>
                  <textarea className="scroll-textarea" placeholder="Write your message here..." required />
                </div>
                <div className="scroll-submit-container">
                  <button type="submit" className="scroll-submit">Seal and Send</button>
                </div>
              </form>
            </>
          ) : (
            <div className="wax-seal-container">
              <div className="wax-seal"></div>
              <div className="seal-message">Your incantation has been sent via Owl.</div>
            </div>
          )}
        </div>
      </div>
      <div className="rune-links-wrapper">
        <a href="mailto:shivurai138@gmail.com" className="wax-link-item">
          <div className="wax-link-seal">E</div>
          <span className="wax-link-text">Email</span>
        </a>
        <a href="https://linkedin.com/in/shivamrai45" target="_blank" rel="noreferrer" className="wax-link-item">
          <div className="wax-link-seal">L</div>
          <span className="wax-link-text">LinkedIn</span>
        </a>
        <a href="#" className="wax-link-item">
          <div className="wax-link-seal">A</div>
          <span className="wax-link-text">ArtStation</span>
        </a>
        <a href="#" className="wax-link-item">
          <div className="wax-link-seal">P</div>
          <span className="wax-link-text">Portfolio</span>
        </a>
      </div>
      <div className="final-copyright" style={{ marginTop: '3rem', fontFamily: 'var(--font-ui)', fontSize: '0.65rem', letterSpacing: '0.3em', color: '#666', textTransform: 'uppercase' }}>
        © 2026 Shivam Rai — All rights reserved
      </div>
    </section>
  )
}

/* ──────────────────────────────────────────────────────────────────
   MAIN APP
   ────────────────────────────────────────────────────────────────── */
export default function App() {
  const [loaded, setLoaded] = useState(false)
  const [entered, setEntered] = useState(false)
  const [showSoundPop, setShowSoundPop] = useState(false)
  const [bgLoadedCount, setBgLoadedCount] = useState(0)
  const appRef = useRef(null)
  const { muted, toggle: toggleSound, playWhoosh, playUIHover, playPageFlip, playGuitarString, forceStartAudio } = useAmbientSound()

  useEffect(() => {
    if (entered && !muted) {
      const timer1 = setTimeout(() => setShowSoundPop(true), 1500)
      const timer2 = setTimeout(() => setShowSoundPop(false), 7000)
      return () => { clearTimeout(timer1); clearTimeout(timer2) }
    }
  }, [entered, muted])

  const triggerCameraShake = useCallback(() => {
    const app = appRef.current
    if (!app) return
    app.classList.add('camera-shake')
    playWhoosh()
    setTimeout(() => app.classList.remove('camera-shake'), 400)
  }, [playWhoosh])

  // Global Magical Particles
  const [globalParticles, setGlobalParticles] = useState([])

  useEffect(() => {
    if (!entered) return // Wait until they enter the site
    const handleGlobalMouseMove = (e) => {
      if (Math.random() > 0.4) {
        const colors = ['#00d2ff', '#ffcc00', '#b400ff']
        const newParticle = {
          id: Date.now() + Math.random(),
          x: e.clientX,
          y: e.clientY,
          size: Math.random() * 8 + 4,
          color: colors[Math.floor(Math.random() * colors.length)]
        }
        setGlobalParticles(prev => [...prev.slice(-20), newParticle])
        setTimeout(() => {
          setGlobalParticles(prev => prev.filter(p => p.id !== newParticle.id))
        }, 800)
      }
    }
    window.addEventListener('mousemove', handleGlobalMouseMove)
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove)
  }, [entered])

  return (
    <>
      <AssetLoaderIndicator loaded={bgLoadedCount} total={TOTAL_FRAMES} />

      {/* Render Global Particles */}
      {globalParticles.map(p => (
        <div 
          key={p.id} 
          className="magical-spark" 
          style={{ 
            left: p.x, 
            top: p.y, 
            width: p.size, 
            height: p.size,
            background: `radial-gradient(circle, #fff, ${p.color}, transparent)`,
            filter: `drop-shadow(0 0 5px ${p.color})`
          }}
        />
      ))}

      {!loaded && <CinematicLoader onComplete={() => setLoaded(true)} />}

      {loaded && !entered && (
        <div 
          style={{
            position: 'fixed', inset: 0, zIndex: 9999, 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            cursor: 'pointer',
            animation: 'fadeInOverlay 2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
          onClick={() => { setEntered(true); forceStartAudio(); }}
        >
          <div className="ancient-font" style={{ marginBottom: '2rem', textAlign: 'center', padding: '0 20px' }}>
            Welcome to the Magical World
          </div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.85rem', letterSpacing: '0.4em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', animation: 'pulseOpacity 2.5s infinite' }}>
            [ Click anywhere to enter ]
          </div>
        </div>
      )}

      {entered && (
        <>
          <CustomCursor />
          <div className="film-grain" />
          <div className="vignette" />
          <div className="scanlines" />

          <FloatingItems />

          <div className="hud">
            <div className="hud-corner hud-corner--tl" />
            <div className="hud-corner hud-corner--tr" />
            <div className="hud-corner hud-corner--bl" />
            <div className="hud-corner hud-corner--br" />
          </div>
          <div className="sound-toggle-wrapper">
            <button 
              className={`sound-toggle-btn ${muted ? 'sound-muted' : ''}`} 
              onClick={() => { toggleSound(); setShowSoundPop(false); }} 
              title="Toggle Sound"
            >
              <div className="sound-bars">
                <div className="sound-bar" /><div className="sound-bar" /><div className="sound-bar" /><div className="sound-bar" />
              </div>
            </button>
            <div className={`sound-popup ${showSoundPop ? 'show' : ''}`} style={{ opacity: showSoundPop ? 1 : 0 }}>
              ♫ Audio Active<br/>Click to mute
            </div>
          </div>
        </>
      )}

      <GlobalBackground onTransition={triggerCameraShake} onProgress={setBgLoadedCount} />

      <div ref={appRef} className="content-layer" style={{ opacity: entered ? 1 : 0, transition: 'opacity 1s ease', pointerEvents: entered ? 'auto' : 'none' }}>
        
        <HeroSection playGuitarString={playGuitarString} />
        
        <ChapterText 
          chapter="Chapter I" 
          title="The Grimoire Awakens" 
          desc="Ancient knowledge stirs within these pages. My journey as an Environment Artist begins by mastering the raw elements."
        />
        
        <SkillTree playHover={playUIHover} />

        <ChapterText 
          chapter="Chapter II" 
          title="Pages of Creation" 
          desc="Arcane diagrams reveal the architecture of digital worlds. Each project is a new dimension brought to life."
        />

        <MissionsShowcase playHover={playPageFlip} />


        <EducationMap playHover={playUIHover} />
        <Archives playHover={playUIHover} />
        <SummoningPortal />

      </div>
    </>
  )
}
