import { BadRequestException } from '@nestjs/common';
import { fileTypeFromFile } from 'file-type';
import { unlink } from 'fs/promises';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Valida os magic bytes de cada ficheiro já gravado em disco.
// Se o tipo real não corresponder ao declarado, apaga o ficheiro e lança excepção.
export async function validateFileMagicBytes(files: Express.Multer.File[]): Promise<void> {
  for (const file of files) {
    const detected = await fileTypeFromFile(file.path);

    if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime)) {
      await unlink(file.path).catch(() => {});
      throw new BadRequestException(
        `Ficheiro inválido: o conteúdo de "${file.originalname}" não é uma imagem JPEG, PNG ou WebP válida.`,
      );
    }
  }
}
