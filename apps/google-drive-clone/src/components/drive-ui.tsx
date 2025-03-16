"use client";

import { useState } from "react";
import {
  ChevronRight,
  File,
  FileText,
  Folder,
  Home,
  Upload,
} from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scrollArea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { toast } from "../hooks/useToast";

// Type definitions for file system
type FileType = {
  id: string;
  name: string;
  type: "file";
  fileType: string;
};

type FolderType = {
  id: string;
  name: string;
  type: "folder";
  children: (FileType | FolderType)[];
};

type FileSystemItem = FileType | FolderType;

// Mock file system data structure
const initialFileSystem: FileSystemItem = {
  id: "root",
  name: "My Drive",
  type: "folder",
  children: [
    {
      id: "docs",
      name: "Documents",
      type: "folder",
      children: [
        { id: "doc1", name: "Resume.pdf", type: "file", fileType: "pdf" },
        {
          id: "doc2",
          name: "Cover Letter.docx",
          type: "file",
          fileType: "docx",
        },
        {
          id: "work",
          name: "Work",
          type: "folder",
          children: [
            {
              id: "work1",
              name: "Project Plan.xlsx",
              type: "file",
              fileType: "xlsx",
            },
            {
              id: "work2",
              name: "Meeting Notes.txt",
              type: "file",
              fileType: "txt",
            },
          ],
        },
      ],
    },
    {
      id: "photos",
      name: "Photos",
      type: "folder",
      children: [
        { id: "photo1", name: "Vacation.jpg", type: "file", fileType: "jpg" },
        { id: "photo2", name: "Family.png", type: "file", fileType: "png" },
        {
          id: "trips",
          name: "Trips",
          type: "folder",
          children: [
            { id: "trip1", name: "Beach.jpg", type: "file", fileType: "jpg" },
            {
              id: "trip2",
              name: "Mountains.jpg",
              type: "file",
              fileType: "jpg",
            },
          ],
        },
      ],
    },
    { id: "file1", name: "Notes.txt", type: "file", fileType: "txt" },
    { id: "file2", name: "Budget.xlsx", type: "file", fileType: "xlsx" },
    {
      id: "projects",
      name: "Projects",
      type: "folder",
      children: [
        {
          id: "project1",
          name: "Website Redesign",
          type: "file",
          fileType: "folder",
        },
        {
          id: "project2",
          name: "Marketing Campaign",
          type: "file",
          fileType: "folder",
        },
        {
          id: "project3",
          name: "Q4 Planning.pptx",
          type: "file",
          fileType: "pptx",
        },
      ],
    },
    {
      id: "shared",
      name: "Shared with me",
      type: "folder",
      children: [
        {
          id: "shared1",
          name: "Team Handbook.pdf",
          type: "file",
          fileType: "pdf",
        },
        {
          id: "shared2",
          name: "Company Logo.png",
          type: "file",
          fileType: "png",
        },
      ],
    },
  ],
};

// Mock files to upload
const mockFilesToUpload: FileType[] = [
  { id: "upload1", name: "Presentation.pptx", type: "file", fileType: "pptx" },
  { id: "upload2", name: "Report.pdf", type: "file", fileType: "pdf" },
  { id: "upload3", name: "Screenshot.png", type: "file", fileType: "png" },
  { id: "upload4", name: "Data Analysis.xlsx", type: "file", fileType: "xlsx" },
];

// Helper function to clone the file system
const cloneFileSystem = <T extends FileSystemItem>(fs: T): T => {
  const parsed = JSON.parse(JSON.stringify(fs)) as T;
  return parsed;
};

// Helper function to find a folder by path and update it
const updateFolderByPath = (
  fileSystem: FolderType,
  path: string[],
  updateFn: (folder: FolderType) => FolderType,
): FolderType => {
  if (path.length === 0) {
    return updateFn(fileSystem);
  }

  const newFileSystem = cloneFileSystem(fileSystem);
  let current = newFileSystem;
  let parent: FolderType | null = null;

  for (const segment of path) {
    parent = current;
    const found = parent.children.find(
      (c): c is FolderType => c.type === "folder" && c.id === segment,
    );
    if (!found) {
      return fileSystem; // Path not found, return original
    }
    current = found;
  }

  if (!parent) return newFileSystem;
  const foundIndex = parent.children.findIndex((c) => c.id === current.id);
  parent.children[foundIndex] = updateFn(current);
  return newFileSystem;
};

export function DriveUI() {
  const [fileSystem, setFileSystem] = useState<FolderType>(
    initialFileSystem as FolderType,
  );
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Helper function to find a folder by path
  const findFolderByPath = (path: string[]): FolderType | null => {
    if (path.length === 0) return fileSystem;

    let current = fileSystem;
    for (const segment of path) {
      const child = current.children.find(
        (c): c is FolderType => c.type === "folder" && c.id === segment,
      );
      if (!child) return null;
      current = child;
    }

    return current;
  };

  const currentFolder = findFolderByPath(currentPath);

  // Generate breadcrumb items based on the current path
  const generateBreadcrumbs = () => {
    type BreadcrumbItem = { id: string; name: string; path?: string[] };
    const breadcrumbs: BreadcrumbItem[] = [{ id: "root", name: "My Drive" }];

    let pathSoFar: string[] = [];

    currentPath.forEach((segment) => {
      pathSoFar = [...pathSoFar, segment];
      const folder = findFolderByPath(pathSoFar);
      if (folder) {
        breadcrumbs.push({
          id: segment,
          name: folder.name,
          path: [...pathSoFar],
        });
      }
    });

    return breadcrumbs;
  };

  const navigateToFolder = (path: string[]) => {
    setCurrentPath(path);
  };

  const navigateUp = () => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1));
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "pdf":
        return <FileText className="h-5 w-5 text-rose-400" />;
      case "docx":
        return <FileText className="h-5 w-5 text-sky-400" />;
      case "xlsx":
        return <FileText className="h-5 w-5 text-emerald-400" />;
      case "pptx":
        return <FileText className="h-5 w-5 text-amber-400" />;
      case "txt":
        return <FileText className="h-5 w-5 text-zinc-400" />;
      case "jpg":
      case "png":
        return <File className="h-5 w-5 text-violet-400" />;
      default:
        return <File className="h-5 w-5 text-zinc-400" />;
    }
  };

  // Handle file upload
  const handleUpload = () => {
    setIsUploading(true);

    // Simulate upload delay
    setTimeout(() => {
      // Get random files from the mock files (1-3 files)
      const numFiles = Math.floor(Math.random() * 3) + 1;
      const filesToUpload = [...mockFilesToUpload]
        .sort(() => 0.5 - Math.random())
        .slice(0, numFiles)
        .map((file) => ({
          ...file,
          id: `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        }));

      // Update the file system
      const updatedFileSystem = updateFolderByPath(
        fileSystem,
        currentPath,
        (folder) => ({
          ...folder,
          children: [...folder.children, ...filesToUpload],
        }),
      );

      setFileSystem(updatedFileSystem);
      setIsUploading(false);

      toast({
        title: "Files uploaded",
        description: `${numFiles} file${numFiles > 1 ? "s" : ""} uploaded successfully.`,
      });
    }, 1500);
  };

  return (
    <div className="flex h-screen flex-col">
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Navigation bar with breadcrumbs and upload button */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/50 p-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={navigateUp}
              disabled={currentPath.length === 0}
              className="text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100"
            >
              <ChevronRight className="h-4 w-4 rotate-180" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="ml-2 flex items-center gap-1 text-zinc-300 hover:bg-zinc-800/70 hover:text-zinc-100"
              onClick={() => navigateToFolder([])}
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Button>

            <Breadcrumb className="ml-2">
              <BreadcrumbList>
                {generateBreadcrumbs().map((crumb, index) => (
                  <BreadcrumbItem key={crumb.id}>
                    {index < generateBreadcrumbs().length - 1 ? (
                      <div className="flex items-center">
                        <BreadcrumbLink
                          onClick={() => navigateToFolder(crumb.path ?? [])}
                          className="cursor-pointer text-zinc-400 hover:text-zinc-100"
                        >
                          {crumb.name}
                        </BreadcrumbLink>
                        <BreadcrumbSeparator className="text-zinc-600" />
                      </div>
                    ) : (
                      <BreadcrumbLink className="font-semibold text-zinc-100">
                        {crumb.name}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="gap-2 bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  <Upload className="h-4 w-4" />
                  {isUploading ? "Uploading..." : "Upload"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Upload files to current folder</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Files and folders grid */}
        <ScrollArea className="flex-1 bg-zinc-900 p-6">
          {currentFolder && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {currentFolder.children.map((item) => (
                <Card
                  key={item.id}
                  className={`cursor-pointer border-zinc-800 bg-zinc-850 transition-all hover:bg-zinc-800 ${
                    item.type === "folder" ? "border-indigo-900/30" : ""
                  } hover:shadow-md hover:shadow-black/20`}
                  onClick={() => {
                    if (item.type === "folder") {
                      navigateToFolder([...currentPath, item.id]);
                    }
                  }}
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center">
                      {item.type === "folder" ? (
                        <Folder className="h-5 w-5 text-indigo-400" />
                      ) : (
                        getFileIcon(item.fileType)
                      )}
                    </div>
                    <p className="truncate text-sm font-medium text-zinc-200">
                      {item.name}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
