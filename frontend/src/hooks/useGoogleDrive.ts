import { gapi } from 'gapi-script';

export const useGoogleDrive = () => {
  const listFiles = async () => {
    try {
      const response = await gapi.client.drive.files.list({
        pageSize: 50,
        fields: 'files(id, name, mimeType)',
        q: "mimeType='application/vnd.google-apps.document'",
      });

      return response.result.files.map((file: { id: string; name: string }) => ({
        id: file.id,
        name: file.name,
      }));
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  };

  const getFileContent = async (fileId: string) => {
    try {
      const response = await gapi.client.drive.files.export({
        fileId: fileId,
        mimeType: 'text/plain',
      });

      return response.body;
    } catch (error) {
      console.error('Error getting file content:', error);
      throw error;
    }
  };

  return {
    listFiles,
    getFileContent,
  };
};
