import * as React from "react";
import { Button, TextField, Box, Container, Fab } from "@mui/material";
import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteIcon from "@mui/icons-material/Delete";
import { uploadImage } from "../../utils/storageUtils";

export default function AddContract(props) {
  const [selectedImages, setSelectedImages] = React.useState([]);
  const [fileInputKey, setFileInputKey] = React.useState(Date.now());

  const handleSubmit = async (event) => {
    try {
      console.log(
        "=====================================START SUBMIT=================="
      );
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      let title = data.get("title");
      let description = data.get("description");

      let image = await uploadImage(selectedImages, "", true);
      console.log("------------------------------IMAGE-------------");
      console.log(selectedImages);
      console.log(image);
      props.handleUploadArticle(title, description, image);
    } catch (err) {
      console.log("Error at handleSubmit add articles...", err);
    }
  };

  const handleImageChange = (event) => {
    const files = event.target.files;
    setSelectedImages([...selectedImages, ...Array.from(files)]);
    setFileInputKey(Date.now()); // Reset the input to allow selecting more images
  };

  const handleImageDelete = (index) => {
    const updatedImages = [...selectedImages];
    updatedImages.splice(index, 1);
    setSelectedImages(updatedImages);
  };

  React.useEffect(() => {
    console.log("Selected images.....");
    console.log(selectedImages);
  }, []);

  return (
    <Container
      component="main"
      sx={{
        width: "100%",
        border: 2,
        borderColor: "#D6D5D9",
        background: "white",
        position: "absolute",
        right: 0,
        zIndex: 1,
        height: "100vh",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          height: "100%",
        }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            height: "100%",
            width: "100%",
          }}
        >
          <Box sx={{ width: "100%" }}>
            <TextField
              margin="normal"
              fullWidth
              id="title"
              label="Title"
              name="title"
              autoComplete="title"
              autoFocus
              sx={{ height: "42px" }}
              size="small"
            />
            <TextField
              margin="normal"
              fullWidth
              name="description"
              label="Description"
              id="description"
              autoComplete="description"
              size="small"
              multiline
              rows={10}
            />
          </Box>

          <Box sx={{ width: "100%" }}>
            {selectedImages.length > 0 ? (
              <ImageList
                sx={{ width: 500, height: 450 }}
                cols={3}
                rowHeight={164}
              >
                {selectedImages.map((item, index) => (
                  <ImageListItem key={index}>
                    <img
                      src={URL.createObjectURL(item)}
                      alt={`Image ${index + 1}`}
                      loading="lazy"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <Fab
                      size="small"
                      color="secondary"
                      aria-label="delete"
                      onClick={() => handleImageDelete(index)}
                      sx={{ position: "absolute", top: 0, right: 0 }}
                    >
                      <DeleteIcon />
                    </Fab>
                  </ImageListItem>
                ))}
              </ImageList>
            ) : (
              <label
                htmlFor="image-upload"
                style={{
                  border: "2px dashed #ccc",
                  borderRadius: "5px",
                  padding: "20px",
                  textAlign: "center",
                  cursor: "pointer",
                  display: "block",
                }}
              >
                <input
                  key={fileInputKey}
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
                <AddPhotoAlternateIcon sx={{ fontSize: 48, color: "#ccc" }} />
                <p>Select Images</p>
              </label>
            )}
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "15%",
            }}
          >
            <Button
              fullWidth
              variant="outlined"
              sx={{
                mt: 3,
                mb: 2,
                mr: 1,
                borderColor: "#04385A",
                color: "#04385A",
                width: "53px",
                textTransform: "capitalize",
              }}
              onClick={() => props.handleShowAddContract()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="secondary"
              sx={{
                mt: 3,
                mb: 2,
                mr: 1,
                width: "38px",
                textTransform: "capitalize",
              }}
            >
              Save
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
