import { handleDelete } from "../../../../lib/analysisApiHandler";

export const config = {
  api: { bodyParser: { sizeLimit: "8mb" }, responseLimit: "8mb" },
};
export default handleDelete;
