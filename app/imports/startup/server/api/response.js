const error = (status = 400, message = 'Something went wrong') => ({
  status,
  message,
});


const body = (status = 200, data = {}) => ({
  status,
  data,
});

export default {
  error,
  body,
};

