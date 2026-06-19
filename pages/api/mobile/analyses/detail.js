import { handleDetail } from "../../../../lib/analysisApiHandler";

export const config = {
  api: { bodyParser: { sizeLimit: "8mb" }, responseLimit: "8mb" },
};
export default handleDetail;
