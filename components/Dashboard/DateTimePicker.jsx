import React, { useState } from 'react';
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { Grid, TextField } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// Extinde Day.js cu plugin-ul de formatare personalizată
dayjs.extend(customParseFormat);


export default function DateTimePicker({setTimpProgramat, timpProgramat, setDataProgramata, dataProgramata}) {
    const initialTime = timpProgramat?.length > 0 ? dayjs(timpProgramat, "HH:mm") : null;
    const initialDate = dataProgramata?.length > 0 ? dayjs(dataProgramata, "DD:MM:YYYY") : null;
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedTime, setSelectedTime] = useState(initialTime);

  const theme = createTheme({
    palette: {
      mode: 'dark',
    },
    components: {
      // Customizați componente specifice aici dacă este necesar
    },
  });

  const handleDateChange = (newDate) => {
   
    console.log(newDate);
    const formattedDate = newDate.format("DD-MM-YYYY"); // Formatează data
    console.log(formattedDate); // Afișează data formatată în consolă
    setDataProgramata(formattedDate); // Presupunând că doriți să setați data formatată
    setSelectedDate(newDate);
  }
  
  const handleTimeChange = (newTime) => {
    console.log(newTime);
    const formattedTime = newTime.format("HH:mm"); // Formatează timpul
    console.log(formattedTime); // Afișează timpul formatat în consolă
    setTimpProgramat(formattedTime); // Presupunând că doriți să setați timpul formatat
    setSelectedTime(newTime);
  }
  
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Grid container spacing={3} justifyContent="center" alignItems="center">
          <Grid item>
            <DatePicker
              renderInput={(props) => <TextField {...props} />}
              value={selectedDate}
              onChange={(newDate) => handleDateChange(newDate)}
              inputFormat="DD-MM-YYYY" // Specifică formatul de afișare al datei
            />
          </Grid>
          <Grid item>
            <TimePicker
              renderInput={(props) => <TextField {...props} inputFormat="HH:mm" />}
              value={selectedTime}
              onChange={(newTime) => handleTimeChange(newTime)}
              ampm={false} // Dezactivează selectorul AM/PM, folosind astfel formatul de 24 de ore
            />
          </Grid>
        </Grid>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
