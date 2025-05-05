import  { useRef, useState } from "react"; 
import axios from "axios";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Undo2, Redo2 } from "lucide-react";

export default function ToneEditor() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tone, setTone] = useState(50);
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";

  const applyTone = async (newTone: number) => {
    const currentText = textareaRef.current?.value || "";
    if (!currentText.trim()) {
        setError("Please enter some text first.");
        return;
    }
    setLoading(true);
    setError(null);
    try {
      const resp = await axios.post(`${apiUrl}/api/enhance`, { 
        text: currentText,
        tone: newTone,
      });
      const result = resp.data?.tonedData; 

      if (result && typeof result === 'string') { 
        setUndoStack(prev => [...prev, currentText]); 
        setRedoStack([]);
        if (textareaRef.current) { 
            textareaRef.current.value = result;
        }
      } else {
        throw new Error("Invalid response format from API.");
      }
    } catch (e: any) {
        console.error("API Error:", e); 
        setError(e.response?.data?.error || e.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const undo = () => {
    if (undoStack.length === 0) return;

    const currentText = textareaRef.current?.value || "";
    const previousText = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, currentText]); 
    setUndoStack(prev => prev.slice(0, -1));

    if (textareaRef.current) {
        textareaRef.current.value = previousText; 
    }
    setError(null); 
  };

  const redo = () => {
    if (redoStack.length === 0) return;

    const currentText = textareaRef.current?.value || "";
    const nextText = redoStack[redoStack.length - 1]; 
    setUndoStack(prev => [...prev, currentText]); 
    setRedoStack(prev => prev.slice(0, -1));

    if (textareaRef.current) {
        textareaRef.current.value = nextText; 
    }
    setError(null); 
  };

  const handleReset = () => {
    if (textareaRef.current) {
        textareaRef.current.value = "";
    }
    setUndoStack([]);
    setRedoStack([]);
    setError(null);
    setLoading(false); 
    setTone(50);
  };
  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4"> 
      <div className="flex flex-col items-center space-y-6 p-6 bg-white rounded-lg shadow-md w-full max-w-lg"> 
        <Textarea
          ref={textareaRef}
          className="w-full min-h-[150px] border-gray-300 focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          placeholder="Type something..."
          aria-label="Text Input"
        />

        <div className="flex items-center space-x-4 w-full"> 
          <Slider
            defaultValue={[tone]} 
            value={[tone]}
            min={0}
            max={100}
            step={1}
            onValueChange={([val]) => setTone(val)}
            className="flex-grow" 
            disabled={loading}   
            aria-label="Tone Slider" 
          />
          <span className="text-sm font-medium text-gray-700 w-8 text-right">{tone}</span> 
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
          <Button
            onClick={() => applyTone(tone)}
            disabled={loading}
            variant="default"
            className="w-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white
            cursor-pointer" 
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
             {loading ? 'Applying...' : 'Enhance'}
          </Button>
          <Button
            onClick={undo}
            disabled={!canUndo || loading} 
            variant="outline" 
            className="w-full flex items-center justify-center cursor-progress" 
          >
            <Undo2 className="w-4 h-4 mr-2" /> Undo
          </Button>
          <Button
            onClick={redo}
            disabled={!canRedo || loading} 
            variant="outline"
            className="w-full flex items-center justify-center" 
          >
            <Redo2 className="w-4 h-4 mr-2" /> Redo
          </Button>
          <Button
            onClick={handleReset}
            disabled={loading} 
            variant="ghost" 
            className="w-full flex items-center justify-center text-gray-600 hover:bg-gray-100" 
          >
            Reset
          </Button>
        </div>
        {loading && !error && ( 
          <div className="flex items-center justify-center space-x-2 text-muted-foreground pt-2">
            <Loader2 className="animate-spin w-4 h-4" />
            <span>Rewriting…</span>
          </div>
        )}
        {error && (
          <div className="text-red-600 text-sm text-center w-full pt-2 break-words"> 
            Error: {error}
          </div>
        )}
      </div>
    </div>
  );
}