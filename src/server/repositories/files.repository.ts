import "server-only";

import { COLLECTIONS } from "@/server/db/collections";
import type { FileDoc } from "@/server/schemas/files.schema";
import { UserScopedRepository } from "./userScoped.repository";

/** Repository for the `file_metadata` collection. */
class FilesRepository extends UserScopedRepository<FileDoc> {
  constructor() {
    super(COLLECTIONS.files);
  }
}

export const filesRepository = new FilesRepository();
