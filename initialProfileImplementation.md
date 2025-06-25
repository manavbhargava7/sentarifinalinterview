## Initial Profile Notes on Implementation (SCROLL FOR MOST UPDATED):

Profile is currently stored in the pipeline class as a private instance variable. 

There is no file based storage, and each pipeline instance maintains its own profile state.

Profile follows structure of UserProfile type in types.ts:

interface UserProfile {
  top_themes: string[];
  theme_count: Record<string, number>;
  dominant_vibe: string;
  vibe_count: Record<string, number>;
  bucket_count: Record<string, number>;
  trait_pool: string[];
  last_theme: string;
}

Profile Lifecycle:

1. Starts at Step 4 with FETCH_PROFILE:
- creates a blank profile when first accessed
- currently does not have external loading

2. Contrast Check (Step 8)
- has very simple logic for updating profile, has a brief lookup table to determine if the emotion has flipped. returns true or false if so. no pattern detection or intensity analysis. 

3. Profile Update (Step 9)
- Increments count for theme, vibe, and bucket
- Recalculates top themes, and dominant vibes and in-place updates it


## UPDATED Implementation:

Profile is only relevant for the 99 case.

Step 8 -> this is where a majority of the logic has been updated, in order to make the dominant vibe determination/if an emotion flip has occured. it updates the profile, and the pipeline then sends that profile to step 9

Step 9 -> Simply updates the profile with all information in the current Profile. Does not have to calculate anything, just updates it


##Contrast Check Implementation:
For emotion flip, I utlized NLP. I weighed the accuracy, speed, and computational expense of each of each approach and created a table:

Approach	                | Speed	Accuracy |	Memory
_____________________________________________________
Full Transformer Ensemble	| 500-2000ms	   | 95%
Single Transformer	      | 100-300ms	     | 85%	
Hybrid (Preferred)	      | 50-100ms	     | 80%	
Rule-based Only	          | 1-5ms	         | 60%

Chose the Hybrid approach
- Still includes basic rule-based emotion flip detections
- Uses all-MiniLM-L6-v2 model that loads once and stays in memory for NLP based decisions
- converts variable length inputs to 384 dimensional embeddings and compares them against emotion reference embeddings via cosine similarity
- uses both rule-based and semantic similarity to make final decision, includes confidence decisions