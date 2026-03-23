import { getConstants } from "@/constants";

export const uploadFiles = async (file: any, folder?: string) => {
  if (!file) throw Error("Files not Found");

  const { url } = getConstants();

  const formData = new FormData();
  if (folder) {
    formData.append("folder", folder);
  }
  formData.append("file", file);

  const token = localStorage.getItem(getConstants().LOCAL_STORAGE_TOKEN);

  const response = await fetch(`${url}/file/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const data = await response.json();

  if (data.message) throw new Error(data.message);

  return data.file;
};
