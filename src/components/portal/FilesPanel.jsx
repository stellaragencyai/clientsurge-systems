import { Download, FileText, Eye, Lock, Folder } from 'lucide-react';
import { useState } from 'react';

const CATEGORY_ICONS = {
  documentation: Folder,
  'setup-guide': FileText,
  credentials: Lock,
  report: FileText,
};

const CATEGORY_LABELS = {
  documentation: 'Documentation',
  'setup-guide': 'Setup Guide',
  credentials: 'Credentials',
  report: 'Report',
};

export default function FilesPanel({ project }) {
  const files = project?.files || [];
  const [previewUrl, setPreviewUrl] = useState(null);

  if (files.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
        <Folder className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
        <h3 className="font-semibold text-foreground">No Files Yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Project files and documentation will appear here as your setup progresses.
        </p>
      </div>
    );
  }

  // Group files by category
  const grouped = files.reduce((acc, file) => {
    const cat = file.category || 'documentation';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(file);
    return acc;
  }, {});

  const sortedCategories = Object.entries(grouped).sort((a, b) => {
    const order = ['documentation', 'setup-guide', 'credentials', 'report'];
    return order.indexOf(a[0]) - order.indexOf(b[0]);
  });

  const handleDownload = (file) => {
    const link = document.createElement('a');
    link.href = file.file_url;
    link.download = file.name || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {sortedCategories.map(([category, categoryFiles]) => {
        const Icon = CATEGORY_ICONS[category] || FileText;
        const label = CATEGORY_LABELS[category] || category;

        return (
          <div key={category}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">{label}</h3>
              <span className="text-xs text-muted-foreground ml-auto">
                {categoryFiles.length} file{categoryFiles.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-2">
              {categoryFiles.map(file => (
                <div
                  key={file.id}
                  className="rounded-xl border border-border hover:border-primary/30 hover:bg-muted/20 p-4 transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{file.name}</p>
                    {file.uploaded_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Added {new Date(file.uploaded_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {file.file_url && (
                      <>
                        <button
                          onClick={() => setPreviewUrl(previewUrl === file.id ? null : file.id)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </button>
                        <a
                          href={file.file_url}
                          download
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </a>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setPreviewUrl(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-border p-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">
                {files.find(f => f.id === previewUrl)?.name}
              </h3>
              <button
                onClick={() => setPreviewUrl(null)}
                className="text-muted-foreground hover:text-foreground text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <iframe
                src={files.find(f => f.id === previewUrl)?.file_url}
                className="w-full h-[600px] rounded-lg border border-border"
                title="Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}