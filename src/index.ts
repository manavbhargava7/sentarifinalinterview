import express from 'express';
import cors from 'cors';
import { SentariPipeline } from './pipeline';
import { MockDataGenerator } from './mockData';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Global pipeline instance
const pipeline = new SentariPipeline();

// API Routes
app.post('/api/process', async (req, res) => {
  try {
    const { transcript, mode } = req.body;
    
    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    // Load mock data for hundred mode
    if (mode === 'hundred' && pipeline.getEntryCount() === 0) {
      const mockEntries = MockDataGenerator.generateMockEntries(99);
      const mockProfile = MockDataGenerator.generateMockProfile(mockEntries);
      pipeline.loadMockEntries(mockEntries);
      pipeline.setProfile(mockProfile);
    }

    const result = await pipeline.processDiaryEntry(transcript);
    res.json(result);
  } catch (error) {
    console.error('Pipeline error:', error);
    res.status(500).json({ error: 'Pipeline processing failed' });
  }
});

app.get('/api/profile', (req, res) => {
  const profile = pipeline.getProfile();
  const entryCount = pipeline.getEntryCount();
  
  res.json({
    profile,
    entryCount,
    isNewUser: entryCount === 0
  });
});

app.post('/api/reset', (req, res) => {
  // Reset pipeline for testing
  const newPipeline = new SentariPipeline();
  Object.assign(pipeline, newPipeline);
  res.json({ message: 'Pipeline reset successfully' });
});

// Serve the HTML UI
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sentari - Transcript to Empathy</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 16px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 30px; 
            text-align: center;
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { opacity: 0.9; font-size: 1.1em; }
        .content { padding: 30px; }
        .form-group { margin-bottom: 25px; }
        label { 
            display: block; 
            margin-bottom: 8px; 
            font-weight: 600; 
            color: #333;
        }
        textarea { 
            width: 100%; 
            min-height: 120px; 
            padding: 15px; 
            border: 2px solid #e1e5e9; 
            border-radius: 8px; 
            font-size: 16px;
            resize: vertical;
            transition: border-color 0.3s;
        }
        textarea:focus { 
            outline: none; 
            border-color: #667eea; 
        }
        .mode-selector { 
            display: flex; 
            gap: 15px; 
            margin-bottom: 20px;
        }
        .mode-option { 
            flex: 1; 
            padding: 15px; 
            border: 2px solid #e1e5e9; 
            border-radius: 8px; 
            text-align: center; 
            cursor: pointer; 
            transition: all 0.3s;
        }
        .mode-option.active { 
            border-color: #667eea; 
            background: #f8f9ff; 
        }
        .btn { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            border: none; 
            padding: 15px 30px; 
            border-radius: 8px; 
            font-size: 16px; 
            cursor: pointer; 
            width: 100%;
            transition: transform 0.2s;
        }
        .btn:hover { transform: translateY(-2px); }
        .btn:disabled { 
            opacity: 0.6; 
            cursor: not-allowed; 
            transform: none;
        }
        .result { 
            margin-top: 30px; 
            padding: 25px; 
            background: #f8f9ff; 
            border-radius: 8px; 
            border-left: 4px solid #667eea;
        }
        .response { 
            font-size: 1.2em; 
            margin-bottom: 15px; 
            padding: 15px; 
            background: white; 
            border-radius: 8px; 
            border: 2px solid #e1e5e9;
        }
        .meta { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
            margin-top: 15px;
        }
        .meta-item { 
            padding: 10px; 
            background: white; 
            border-radius: 6px; 
            font-size: 0.9em;
        }
        .logs { 
            margin-top: 20px; 
            background: #2d3748; 
            color: #e2e8f0; 
            padding: 20px; 
            border-radius: 8px; 
            font-family: 'Monaco', 'Courier New', monospace; 
            font-size: 0.85em; 
            max-height: 300px; 
            overflow-y: auto;
        }
        .loading { text-align: center; padding: 20px; }
        .spinner { 
            border: 3px solid #f3f3f3; 
            border-top: 3px solid #667eea; 
            border-radius: 50%; 
            width: 30px; 
            height: 30px; 
            animation: spin 1s linear infinite; 
            margin: 0 auto 15px;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧩 Sentari</h1>
            <p>From Transcript to Empathy</p>
        </div>
        
        <div class="content">
            <div class="form-group">
                <label>Simulation Mode</label>
                <div class="mode-selector">
                    <div class="mode-option active" data-mode="first">
                        <strong>First Entry</strong><br>
                        <small>New user, no prior data</small>
                    </div>
                    <div class="mode-option" data-mode="hundred">
                        <strong>100th Entry</strong><br>
                        <small>Established user with 99 entries</small>
                    </div>
                </div>
            </div>
            
            <div class="form-group">
                <label for="transcript">Diary Transcript</label>
                <textarea 
                    id="transcript" 
                    placeholder="I keep checking Slack even when I'm exhausted. I know I need rest, but I'm scared I'll miss something important."
                >I keep checking Slack even when I'm exhausted. I know I need rest, but I'm scared I'll miss something important.</textarea>
            </div>
            
            <button class="btn" onclick="processTranscript()">
                Process Entry Through 13-Step Pipeline
            </button>
            
            <div id="result" style="display: none;"></div>
        </div>
    </div>

    <script>
        let selectedMode = 'first';
        
        // Mode selection
        document.querySelectorAll('.mode-option').forEach(option => {
            option.addEventListener('click', function() {
                document.querySelectorAll('.mode-option').forEach(o => o.classList.remove('active'));
                this.classList.add('active');
                selectedMode = this.dataset.mode;
            });
        });
        
        async function processTranscript() {
            const transcript = document.getElementById('transcript').value.trim();
            const resultDiv = document.getElementById('result');
            
            if (!transcript) {
                alert('Please enter a transcript');
                return;
            }
            
            // Show loading
            resultDiv.style.display = 'block';
            resultDiv.innerHTML = \`
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Processing through 13-step pipeline...</p>
                </div>
            \`;
            
            try {
                // Capture console logs
                const logs = [];
                const originalLog = console.log;
                console.log = function(...args) {
                    logs.push(args.join(' '));
                    originalLog.apply(console, arguments);
                };
                
                const response = await fetch('/api/process', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ transcript, mode: selectedMode })
                });
                
                console.log = originalLog;
                
                if (!response.ok) {
                    throw new Error('Pipeline processing failed');
                }
                
                const result = await response.json();
                displayResult(result);
                
            } catch (error) {
                resultDiv.innerHTML = \`
                    <div class="result">
                        <h3 style="color: #e53e3e;">Error</h3>
                        <p>\${error.message}</p>
                    </div>
                \`;
            }
        }
        
        function displayResult(result) {
            const resultDiv = document.getElementById('result');
            
            resultDiv.innerHTML = \`
                <div class="result">
                    <h3>🤖 AI Response</h3>
                    <div class="response">
                        "\${result.response_text}"
                        <small style="color: #666; display: block; margin-top: 5px;">
                            (\${result.response_text.length} characters)
                        </small>
                    </div>
                    
                    <div class="meta">
                        <div class="meta-item">
                            <strong>Entry ID:</strong><br>
                            \${result.entryId}
                        </div>
                        <div class="meta-item">
                            <strong>Carry-in:</strong><br>
                            \${result.carry_in ? '✅ Yes' : '❌ No'}
                        </div>
                        <div class="meta-item">
                            <strong>Emotion Flip:</strong><br>
                            \${result.emotion_flip ? '🔄 Yes' : '➡️ No'}
                        </div>
                        <div class="meta-item">
                            <strong>Dominant Vibe:</strong><br>
                            \${result.updated_profile.dominant_vibe || 'N/A'}
                        </div>
                        <div class="meta-item">
                            <strong>Top Themes:</strong><br>
                            \${result.updated_profile.top_themes.slice(0, 3).join(', ') || 'N/A'}
                        </div>
                        <div class="meta-item">
                            <strong>Traits:</strong><br>
                            \${result.updated_profile.trait_pool.slice(0, 3).join(', ') || 'N/A'}
                        </div>
                    </div>
                    
                    <details style="margin-top: 20px;">
                        <summary style="cursor: pointer; font-weight: 600;">View Full Profile</summary>
                        <pre style="background: #f8f9ff; padding: 15px; border-radius: 6px; margin-top: 10px; overflow-x: auto; font-size: 0.85em;">\${JSON.stringify(result.updated_profile, null, 2)}</pre>
                    </details>
                </div>
            \`;
        }
    </script>
</body>
</html>
  `);
});

app.listen(port, () => {
  console.log(`\n🧩 Sentari Pipeline Server running at http://localhost:${port}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`- Web UI: http://localhost:${port}`);
  console.log(`- API: POST /api/process`);
  console.log(`- Profile: GET /api/profile`);
  console.log(`\nTo run simulations:`);
  console.log(`- npm run simulate:first`);
  console.log(`- npm run simulate:hundred\n`);
}); 