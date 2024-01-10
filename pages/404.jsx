import React from 'react';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Head from 'next/head';

// Dynamically import the Shape component
const Shape = dynamic(() => import('../components/Shape'), {
  ssr: false,
});

const commonTypographyStyles = {
  fontSize: '140px',
  color: 'black',
  fontFamily: 'Inter',
};

const PageNotFound = () => {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  return (
    <>
      <Head>
        <title>404 Not Found | Numele Site-ului</title>
        <meta name="description" content="Pagina pe care o căutați nu a fost găsită." />
        <meta name="og:title" content="404 Not Found | Numele Site-ului" />
        <meta name="og:description" content="Pagina pe care o căutați nu a fost găsită." />
        <meta name="keywords" content="404, not found, error" />
      </Head>
      <Stack
        sx={{ width: '100%', height: '100vh' }}
        direction="column"
        justifyContent="center"
        alignItems="center"
      >
        <Shape
          position="absolute"
          width="186px"
          height="117px"
          left="32%"
          top="24%"
          borderRadius="14px"
          background="linear-gradient(134.55deg, rgba(37,37,37, 0.2) 5.97%, rgba(37,37,37, 0) 75%)"
        />
        <Shape
          position="absolute"
          width="145.35px"
          height="157.46px"
          right="33%"
          top="34%"
          borderRadius="58.5px"
          background="linear-gradient(134.55deg, rgba(37,37,37, 0.2) 5.97%, rgba(37,37,37, 0) 75%)"
          transform="rotate(135deg)"
        />
        <Stack direction="row" alignItems="center" justifyContent="center">
          <Typography sx={commonTypographyStyles}>4</Typography>
          <Typography sx={{ ...commonTypographyStyles, position: 'relative', top: '20px' }}>
            0
          </Typography>
          <Typography sx={commonTypographyStyles}>4</Typography>
        </Stack>
        <Typography variant="h4" gutterBottom>
          Page not found
        </Typography>
        <Typography variant="body2" mb={2}>
          The page you are trying to reach is not available. It may have been deleted or its URL
          was misspelled.
        </Typography>
        <Button
          onClick={handleGoBack}
          variant="contained"
          sx={{
            backgroundColor: '#04385A',
            '&:hover': {
              backgroundColor: '#035A78', // Adjust hover state as needed
            },
            width: 80,
            height: 40,
            borderRadius: '8px',
            fontSize: '10px',
            mt: 1,
          }}
        >
          Go back
        </Button>
      </Stack>
    </>
  );
};

export default PageNotFound;
