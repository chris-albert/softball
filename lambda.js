module.exports = function(result) {
  return {
    handler(event, context, done) {
      result(event, context)
        .then(response => {
          console.log(response);
          done(null,response);
        })
        .catch(error => {
          console.error(error);
          done(error);
        })
    },
    mock(event, context) {
       return this;
    }
  }
};