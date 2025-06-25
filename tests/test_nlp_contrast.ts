import { SentariPipeline } from '../src/pipeline_master';
import { UserProfile } from '../src/types';

/**
 * Test NLP-enhanced emotion flip detection in contrast_check.ts
 */
async function testNLPContrastCheck() {
    console.log("🤖 Testing NLP-Enhanced Contrast Check with all-MiniLM-L6-v2\n");
    
    const pipeline = new SentariPipeline();
    
    const testCases = [
        {
            name: "Strong Flip: Excited → Exhausted",
            profile: {
                top_themes: ["work", "projects"],
                theme_count: { "work": 15, "projects": 8 },
                dominant_vibe: "excited",
                vibe_count: { "excited": 20, "motivated": 5 },
                bucket_count: { "Goal": 12, "Thought": 8 },
                trait_pool: ["builder", "organiser"],
                last_theme: "work"
            } as UserProfile,
            text: "I'm completely drained and worn out. This project has exhausted me beyond belief and I can't handle any more work.",
            expectedFlip: true
        },
        
        {
            name: "Semantic Flip: Driven → Overwhelmed",
            profile: {
                top_themes: ["career", "goals"],
                theme_count: { "career": 25, "goals": 18 },
                dominant_vibe: "driven",
                vibe_count: { "driven": 30, "confident": 12 },
                bucket_count: { "Goal": 20, "Value": 10 },
                trait_pool: ["organiser", "builder"],
                last_theme: "career"
            } as UserProfile,
            text: "I feel swamped with everything on my plate. There's too much to handle and I'm stressed beyond my limits.",
            expectedFlip: true
        },
        
        {
            name: "No Flip: Consistent Emotion",
            profile: {
                top_themes: ["learning", "growth"],
                theme_count: { "learning": 12, "growth": 9 },
                dominant_vibe: "curious",
                vibe_count: { "curious": 18, "motivated": 7 },
                bucket_count: { "Goal": 15, "Thought": 10 },
                trait_pool: ["learner", "curious"],
                last_theme: "learning"
            } as UserProfile,
            text: "I'm still fascinated by this new technology and eager to explore more possibilities. This learning journey continues to intrigue me.",
            expectedFlip: false
        },
        
        {
            name: "Subtle Semantic Shift: Confident → Anxious",
            profile: {
                top_themes: ["leadership", "decisions"],
                theme_count: { "leadership": 20, "decisions": 15 },
                dominant_vibe: "confident",
                vibe_count: { "confident": 25, "driven": 10 },
                bucket_count: { "Goal": 18, "Value": 12 },
                trait_pool: ["leader", "decision-maker"],
                last_theme: "leadership"
            } as UserProfile,
            text: "I'm worried about making the wrong choice. The uncertainty is making me nervous and I feel stressed about the outcome.",
            expectedFlip: true
        },
        
        {
            name: "Metaphorical Expression: Driven → Exhausted",
            profile: {
                top_themes: ["startup", "innovation"],
                theme_count: { "startup": 30, "innovation": 15 },
                dominant_vibe: "driven",
                vibe_count: { "driven": 35, "excited": 20 },
                bucket_count: { "Goal": 25, "Thought": 10 },
                trait_pool: ["entrepreneur", "innovator"],
                last_theme: "startup"
            } as UserProfile,
            text: "The energy has completely left me and I feel like I'm running on empty. The fire that used to burn bright is now just ashes.",
            expectedFlip: true
        }
    ];
    
    console.log("🔄 Loading sentence-transformer model (all-MiniLM-L6-v2)...");
    console.log("This may take a moment on first run as the model downloads.\n");
    
    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(`${i + 1}. ${testCase.name}`);
        console.log(`   Previous Emotion: ${testCase.profile.dominant_vibe}`);
        console.log(`   Text: "${testCase.text}"`);
        
        pipeline.setProfile(testCase.profile);
        
        try {
            // Process the full diary entry to get detected emotions
            const result = await pipeline.processDiaryEntry(testCase.text);
            
            console.log(`\n   📊 Results:`);
            console.log(`   Emotion Flip: ${result.emotion_flip ? '✅ YES' : '❌ NO'}`);
            console.log(`   Previous → Current: ${testCase.profile.dominant_vibe} → ${result.updated_profile.dominant_vibe}`);
            
            // Validation
            const correct = result.emotion_flip === testCase.expectedFlip;
            console.log(`   Accuracy: ${correct ? '✅ CORRECT' : '❌ INCORRECT'}`);
            
        } catch (error) {
            console.log(`   ❌ Error: ${error}`);
        }
        
        console.log("\n" + "=".repeat(70));
    }
}

// Performance test
async function performanceTest() {
    console.log("\n🚀 Performance Test\n");
    
    const pipeline = new SentariPipeline();
    
    const testProfile: UserProfile = {
        top_themes: ["work"],
        theme_count: { "work": 50 },
        dominant_vibe: "excited",
        vibe_count: { "excited": 30 },
        bucket_count: { "Goal": 25 },
        trait_pool: ["builder"],
        last_theme: "work"
    };
    
    pipeline.setProfile(testProfile);
    
    const testTexts = [
        "I'm completely exhausted and can't continue with this project anymore.",
        "This is fantastic and I'm really excited about the new opportunities ahead.",
        "I feel overwhelmed with all the responsibilities on my shoulders right now."
    ];
    
    console.log("Running performance tests...");
    
    let totalTime = 0;
    const iterations = 3;
    
    for (let i = 0; i < iterations; i++) {
        const text = testTexts[i % testTexts.length];
        
        const startTime = performance.now();
        await pipeline.processDiaryEntry(text);
        const duration = performance.now() - startTime;
        
        totalTime += duration;
        console.log(`  Test ${i + 1}: ${duration.toFixed(1)}ms`);
    }
    
    const avgTime = totalTime / iterations;
    console.log(`\nAverage processing time: ${avgTime.toFixed(1)}ms`);
    console.log(`Throughput: ${(1000 / avgTime).toFixed(0)} analyses per second`);
    
    if (avgTime < 500) {
        console.log("✅ Performance acceptable for real-time processing");
    } else {
        console.log("⚠️ Performance may need optimization for real-time use");
    }
}

// Semantic understanding demonstration
async function demonstrateSemanticUnderstanding() {
    console.log("\n\n🧠 Semantic Understanding Demo\n");
    
    const pipeline = new SentariPipeline();
    
    const demoProfile: UserProfile = {
        top_themes: ["work"],
        theme_count: { "work": 30 },
        dominant_vibe: "excited",
        vibe_count: { "excited": 25 },
        bucket_count: { "Goal": 20 },
        trait_pool: ["enthusiast"],
        last_theme: "work"
    };
    
    pipeline.setProfile(demoProfile);
    
    const semanticExamples = [
        {
            text: "The energy has completely left me and I feel like I'm running on empty",
            note: "Semantic exhaustion without using the word 'exhausted'"
        },
        {
            text: "My enthusiasm has transformed into worry and concern about everything",
            note: "Semantic transition from positive to negative emotion"
        },
        {
            text: "I'm bursting with anticipation and can't wait to start this new adventure",
            note: "Semantic excitement using different vocabulary"
        },
        {
            text: "The weight of responsibilities is crushing my spirit and motivation",
            note: "Metaphorical expression of being overwhelmed"
        }
    ];
    
    for (const example of semanticExamples) {
        console.log(`📝 Text: "${example.text}"`);
        console.log(`🎯 Note: ${example.note}`);
        
        try {
            const result = await pipeline.processDiaryEntry(example.text);
            console.log(`🔍 Result: Flip=${result.emotion_flip}, excited→${result.updated_profile.dominant_vibe}`);
        } catch (error) {
            console.log(`❌ Error: ${error}`);
        }
        console.log("");
    }
}

// Main execution
if (require.main === module) {
    testNLPContrastCheck()
        .then(() => performanceTest())
        .then(() => demonstrateSemanticUnderstanding())
        .then(() => console.log("\n✨ NLP emotion flip detection testing complete!"))
        .catch(error => {
            console.error("❌ Test failed:", error);
            process.exit(1);
        });
}

export { testNLPContrastCheck, performanceTest, demonstrateSemanticUnderstanding }; 