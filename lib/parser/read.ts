import { strFromU8, unzipSync } from "fflate";
import type { ParsedExport } from "../types";
import { isRelevantPath, parseExportFiles, type ExportFile } from "./parse";

export interface InputFile {
  file: File;
  path: string;
}

async function filesFromZip(file: File): Promise<ExportFile[]> {
  const data = new Uint8Array(await file.arrayBuffer());
  const entries = unzipSync(data, { filter: (f) => isRelevantPath(f.name) });
  return Object.entries(entries).map(([path, bytes]) => ({ path, text: strFromU8(bytes) }));
}

/** Reads a mix of .zip archives and loose files (e.g. from a dropped folder) into a parsed export. */
export async function readExportFromFiles(inputs: InputFile[]): Promise<ParsedExport> {
  const files: ExportFile[] = [];
  for (const { file, path } of inputs) {
    if (/\.zip$/i.test(file.name)) {
      files.push(...(await filesFromZip(file)));
    } else if (isRelevantPath(path)) {
      files.push({ path, text: await file.text() });
    }
  }
  return parseExportFiles(files);
}

type FsEntry = FileSystemEntry & Partial<FileSystemFileEntry & FileSystemDirectoryEntry>;

async function walkEntry(entry: FsEntry, out: InputFile[]): Promise<void> {
  if (entry.isFile && entry.file) {
    const file = await new Promise<File>((resolve, reject) => entry.file!(resolve, reject));
    out.push({ file, path: entry.fullPath });
    return;
  }
  if (entry.isDirectory && entry.createReader) {
    const reader = entry.createReader();
    // readEntries returns results in batches until it yields an empty array.
    for (;;) {
      const batch = await new Promise<FileSystemEntry[]>((resolve, reject) =>
        reader.readEntries(resolve, reject),
      );
      if (batch.length === 0) break;
      for (const child of batch) await walkEntry(child as FsEntry, out);
    }
  }
}

export async function inputFilesFromDrop(dataTransfer: DataTransfer): Promise<InputFile[]> {
  const entries = Array.from(dataTransfer.items)
    .map((item) => item.webkitGetAsEntry?.())
    .filter((e): e is FileSystemEntry => !!e);
  if (entries.length === 0) {
    return Array.from(dataTransfer.files).map((file) => ({ file, path: file.name }));
  }
  const out: InputFile[] = [];
  for (const entry of entries) await walkEntry(entry as FsEntry, out);
  return out;
}

export function inputFilesFromList(list: FileList): InputFile[] {
  return Array.from(list).map((file) => ({ file, path: file.webkitRelativePath || file.name }));
}
