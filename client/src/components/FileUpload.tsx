import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}

export function FileUpload({ onUpload, isUploading }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    if (acceptedFiles.length > 0) {
      const selected = acceptedFiles[0];
      if (selected.size > 10 * 1024 * 1024) { // 10MB limit
        setError("File size too large (max 10MB)");
        return;
      }
      setFile(selected);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  const handleUpload = async () => {
    if (!file) return;
    
    // Simulate progress for UX
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);

    try {
      await onUpload(file);
      setUploadProgress(100);
    } catch (err) {
      setError("Failed to upload file");
      setUploadProgress(0);
    } finally {
      clearInterval(interval);
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setUploadProgress(0);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-200 cursor-pointer
          ${isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"}
          ${error ? "border-destructive/50 bg-destructive/5" : ""}
        `}
      >
        <input {...getInputProps()} />
        
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Upload Syllabus</h3>
                <p className="text-muted-foreground mt-1">
                  Drag & drop your PDF or Image here, or click to select
                </p>
              </div>
              <p className="text-xs text-muted-foreground/70">Max 10MB • PDF, JPG, PNG</p>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="w-full"
            >
              <div className="flex items-center gap-4 bg-background p-4 rounded-xl border border-border shadow-sm">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                {!isUploading && (
                  <Button variant="ghost" size="icon" onClick={removeFile} className="hover:bg-destructive/10 hover:text-destructive">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {isUploading && (
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Uploading & Parsing...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {file && !isUploading && (
        <div className="mt-6 flex justify-center">
          <Button 
            size="lg" 
            onClick={handleUpload}
            className="w-full sm:w-auto px-8 font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30"
          >
            Start Parsing
          </Button>
        </div>
      )}
    </div>
  );
}
