import './style.css'
import * as THREE from 'three'

class ASCIICube {
  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera
  private renderer!: THREE.WebGLRenderer
  private cube!: THREE.Mesh
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private image: HTMLImageElement
  private chars = ' .:-=+*#%@'
  private width = 120
  private height = 80
  private autoRotationSpeed = 0.005
  
  // Mouse interaction properties
  private isMouseDown = false
  private lastMouseX = 0
  private lastMouseY = 0
  private rotationVelocityX = 0
  private rotationVelocityY = 0
  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2()

  constructor() {
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')!
    this.image = new Image()
    
    this.init()
  }

  private init() {
    this.canvas.width = this.width
    this.canvas.height = this.height
    
    // Initialize Three.js scene
    this.initThreeJS()
    
    // Create ASCII "Coming Soon" text
    this.createASCIIText()
    
    // Load the image
    this.image.onload = () => {
      this.createCubeWithASCII()
      this.animate()
    }
    
    // Use the clive-me.png image
    this.image.src = '/clive-me.png'
    
    // Mouse tracking and interaction
    this.setupMouseInteraction()
    
    // Window resize
    window.addEventListener('resize', () => {
      this.onWindowResize()
    })
  }

  private setupMouseInteraction() {
    const rendererElement = this.renderer.domElement
    
    // Mouse move for cursor and interaction
    document.addEventListener('mousemove', (e) => {
      // Update cursor position
      const cursor = document.getElementById('cursor')
      if (cursor) {
        cursor.style.left = e.clientX + 'px'
        cursor.style.top = e.clientY + 'px'
      }
      
      // Handle cube rotation when mouse is down
      if (this.isMouseDown) {
        const deltaX = e.clientX - this.lastMouseX
        const deltaY = e.clientY - this.lastMouseY
        
        this.rotationVelocityY = deltaX * 0.01
        this.rotationVelocityX = deltaY * 0.01
        
        this.lastMouseX = e.clientX
        this.lastMouseY = e.clientY
      }
    })
    
    // Mouse down - check if clicking on cube
    rendererElement.addEventListener('mousedown', (e) => {
      // Convert mouse position to normalized device coordinates
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
      
      // Update the raycaster
      this.raycaster.setFromCamera(this.mouse, this.camera)
      
      // Check for intersections with the cube
      const intersects = this.raycaster.intersectObject(this.cube)
      
      if (intersects.length > 0) {
        this.isMouseDown = true
        this.lastMouseX = e.clientX
        this.lastMouseY = e.clientY
        
        // Prevent default to avoid text selection
        e.preventDefault()
      }
    })
    
    // Mouse up - stop interaction
    document.addEventListener('mouseup', () => {
      if (this.isMouseDown) {
        this.isMouseDown = false
      }
    })
  }

  private initThreeJS() {
    // Create scene
    this.scene = new THREE.Scene()
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    this.camera.position.z = 3
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      preserveDrawingBuffer: true 
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setClearColor(0x000000, 0) // Transparent background
    
    // Add renderer to the ASCII container
    const container = document.getElementById('ascii-container')!
    container.innerHTML = '' // Clear any existing content
    container.appendChild(this.renderer.domElement)
  }

  private convertToASCII(): string {
    // Clear canvas with transparent background
    this.ctx.clearRect(0, 0, this.width, this.height)
    
    // Calculate aspect ratios - ensure we fit the entire image
    const imageAspect = this.image.width / this.image.height
    const canvasAspect = this.width / this.height
    
    let drawWidth, drawHeight, offsetX, offsetY
    
    // Always fit the entire image
    if (imageAspect > canvasAspect) {
      drawWidth = this.width
      drawHeight = this.width / imageAspect
      offsetX = 0
      offsetY = (this.height - drawHeight) / 2
    } else {
      drawHeight = this.height
      drawWidth = this.height * imageAspect
      offsetX = (this.width - drawWidth) / 2
      offsetY = 0
    }
    
    // Draw image to canvas
    this.ctx.drawImage(this.image, offsetX, offsetY, drawWidth, drawHeight)
    
    // Get image data
    const imageData = this.ctx.getImageData(0, 0, this.width, this.height)
    const pixels = imageData.data
    
    let lines: string[] = []
    
    for (let y = 0; y < this.height; y++) {
      let line = ''
      
      for (let x = 0; x < this.width; x++) {
        const pixelIndex = (y * this.width + x) * 4
        const r = pixels[pixelIndex]
        const g = pixels[pixelIndex + 1]
        const b = pixels[pixelIndex + 2]
        const alpha = pixels[pixelIndex + 3]
        
        if (alpha === 0) {
          line += ' '
        } else if (alpha < 50) {
          line += ' '
        } else {
          const brightness = (r + g + b) / 3
          const adjustedBrightness = brightness * (alpha / 255)
          const charIndex = Math.floor((adjustedBrightness / 255) * (this.chars.length - 1))
          line += this.chars[charIndex]
        }
      }
      
      // Always add the line, but trim trailing spaces only
      lines.push(line.trimEnd())
    }
    
    // Remove empty lines from top and bottom only
    while (lines.length > 0 && lines[0].trim() === '') {
      lines.shift()
    }
    while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
      lines.pop()
    }
    
    return lines.join('\n')
  }

  private createASCIITexture(asciiText: string): THREE.CanvasTexture {
    // Create a canvas for the ASCII text
    const textCanvas = document.createElement('canvas')
    const textCtx = textCanvas.getContext('2d')!
    
    // Calculate proper dimensions based on ASCII content
    const lines = asciiText.split('\n')
    const maxLineLength = Math.max(...lines.map(line => line.length))
    
    // Character dimensions (monospace font)
    const charWidth = 6
    const charHeight = 8
    const padding = 20
    
    // Set canvas size to fit ASCII content properly
    textCanvas.width = maxLineLength * charWidth + padding * 2
    textCanvas.height = lines.length * charHeight + padding * 2
    
    // Make it square by using the larger dimension
    const size = Math.max(textCanvas.width, textCanvas.height)
    textCanvas.width = size
    textCanvas.height = size
    
    // Clear with black background
    textCtx.fillStyle = '#000000'
    textCtx.fillRect(0, 0, textCanvas.width, textCanvas.height)
    
    // Set up text styling
    textCtx.fillStyle = '#00ff00'
    textCtx.font = `${charHeight}px "Courier New", monospace`
    textCtx.textBaseline = 'top'
    textCtx.textAlign = 'left'
    
    // Add glow effect
    textCtx.shadowColor = '#00ff00'
    textCtx.shadowBlur = 2
    
    // Calculate starting position to center the ASCII art
    const contentWidth = maxLineLength * charWidth
    const contentHeight = lines.length * charHeight
    const startX = (textCanvas.width - contentWidth) / 2
    const startY = (textCanvas.height - contentHeight) / 2
    
    // Draw ASCII text line by line
    lines.forEach((line, index) => {
      const y = startY + index * charHeight
      textCtx.fillText(line, startX, y)
    })
    
    // Create texture
    const texture = new THREE.CanvasTexture(textCanvas)
    texture.needsUpdate = true
    texture.generateMipmaps = false
    texture.minFilter = THREE.NearestFilter
    texture.magFilter = THREE.NearestFilter
    
    return texture
  }

  private createCubeWithASCII() {
    const asciiText = this.convertToASCII()
    const texture = this.createASCIITexture(asciiText)
    
    // Create cube geometry
    const geometry = new THREE.BoxGeometry(2, 2, 2)
    
    // Create materials for each face (all with the same ASCII image)
    const materials = [
      new THREE.MeshBasicMaterial({ map: texture }), // Right
      new THREE.MeshBasicMaterial({ map: texture }), // Left
      new THREE.MeshBasicMaterial({ map: texture }), // Top
      new THREE.MeshBasicMaterial({ map: texture }), // Bottom
      new THREE.MeshBasicMaterial({ map: texture }), // Front
      new THREE.MeshBasicMaterial({ map: texture })  // Back
    ]
    
    // Create cube mesh
    this.cube = new THREE.Mesh(geometry, materials)
    this.scene.add(this.cube)
  }

  private createASCIIText() {
    const comingSoonElement = document.getElementById('coming-soon-ascii')!
    
    // Generate "COMING SOON" using the same ASCII chars
    const comingSoonText = this.generateASCIILetters('COMING SOON')
    
    comingSoonElement.textContent = comingSoonText
    
    // Add some random glitch effect
    this.addGlitchEffect(comingSoonElement)
  }

  private generateASCIILetters(text: string): string {
    const letters: { [key: string]: string[] } = {
      'C': [
        ' @@@@@ ',
        '@     @',
        '@      ',
        '@      ',
        '@      ',
        '@     @',
        ' @@@@@ '
      ],
      'O': [
        ' @@@@@ ',
        '@     @',
        '@     @',
        '@     @',
        '@     @',
        '@     @',
        ' @@@@@ '
      ],
      'M': [
        '@     @',
        '@@   @@',
        '@ @ @ @',
        '@  @  @',
        '@     @',
        '@     @',
        '@     @'
      ],
      'I': [
        '@@@@@@@',
        '   @   ',
        '   @   ',
        '   @   ',
        '   @   ',
        '   @   ',
        '@@@@@@@'
      ],
      'N': [
        '@     @',
        '@@    @',
        '@ @   @',
        '@  @  @',
        '@   @ @',
        '@    @@',
        '@     @'
      ],
      'G': [
        ' @@@@@ ',
        '@     @',
        '@      ',
        '@  @@@@',
        '@     @',
        '@     @',
        ' @@@@@ '
      ],
      'S': [
        ' @@@@@ ',
        '@     @',
        '@      ',
        ' @@@@@ ',
        '      @',
        '@     @',
        ' @@@@@ '
      ],
      ' ': [
        '       ',
        '       ',
        '       ',
        '       ',
        '       ',
        '       ',
        '       '
      ]
    }

    // Convert each character to use the density chars
    const densityChars = this.chars
    const processedLetters: { [key: string]: string[] } = {}
    
    Object.keys(letters).forEach(letter => {
      processedLetters[letter] = letters[letter].map(line => {
        return line.split('').map(char => {
          if (char === '@') return densityChars[densityChars.length - 1] // Darkest char
          if (char === '#') return densityChars[Math.floor(densityChars.length * 0.8)]
          if (char === '*') return densityChars[Math.floor(densityChars.length * 0.6)]
          if (char === '+') return densityChars[Math.floor(densityChars.length * 0.4)]
          if (char === '-') return densityChars[Math.floor(densityChars.length * 0.2)]
          return densityChars[0] // Space
        }).join('')
      })
    })

    // Build the final text
    const lines = ['', '', '', '', '', '', '']
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i].toUpperCase()
      const letterPattern = processedLetters[char] || processedLetters[' ']
      
      for (let lineIndex = 0; lineIndex < 7; lineIndex++) {
        lines[lineIndex] += letterPattern[lineIndex] + ' ' // Add space between letters
      }
    }
    
    return lines.join('\n')
  }

  private addGlitchEffect(element: HTMLElement) {
    setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance every interval
        element.style.transform = `translate(${Math.random() * 4 - 2}px, ${Math.random() * 2 - 1}px)`
        element.style.filter = 'hue-rotate(${Math.random() * 30}deg)'
        
        setTimeout(() => {
          element.style.transform = 'translate(0, 0)'
          element.style.filter = 'none'
        }, 100)
      }
    }, 200)
  }

  private animate() {
    requestAnimationFrame(() => this.animate())
    
    if (this.isMouseDown) {
      // Manual control - apply rotation velocities
      this.cube.rotation.x += this.rotationVelocityX
      this.cube.rotation.y += this.rotationVelocityY
      
      // Add some damping to the rotation
      this.rotationVelocityX *= 0.95
      this.rotationVelocityY *= 0.95
    } else {
      // Auto rotation when not being controlled
      this.cube.rotation.y += this.autoRotationSpeed
      this.cube.rotation.x += this.autoRotationSpeed * 0.5
      
      // Reset velocities when not interacting
      this.rotationVelocityX = 0
      this.rotationVelocityY = 0
    }
    
    // Add some bobbing motion
    this.cube.position.y = Math.sin(Date.now() * 0.001) * 0.1
    
    // Render the scene
    this.renderer.render(this.scene, this.camera)
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }
}

// Initialize the ASCII cube when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ASCIICube()
})

// Matrix background effect (simplified for performance)
function createMatrixEffect() {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  
  canvas.style.position = 'fixed'
  canvas.style.top = '0'
  canvas.style.left = '0'
  canvas.style.zIndex = '-1'
  canvas.style.opacity = '0.05'
  
  document.body.appendChild(canvas)
  
  function resizeCanvas() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  
  resizeCanvas()
  window.addEventListener('resize', resizeCanvas)
  
  const chars = '01'
  const fontSize = 20
  const columns = canvas.width / fontSize
  const drops: number[] = Array(Math.floor(columns)).fill(1)
  
  function draw() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    ctx.fillStyle = '#00ff00'
    ctx.font = `${fontSize}px Courier New`
    
    for (let i = 0; i < drops.length; i++) {
      const text = chars[Math.floor(Math.random() * chars.length)]
      ctx.fillText(text, i * fontSize, drops[i] * fontSize)
      
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0
      }
      drops[i]++
    }
  }
  
  setInterval(draw, 150)
}

// Start matrix effect
createMatrixEffect() 