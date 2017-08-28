const event   = {
        seasonId: 274,
        teamId  : 6263
      },
      context = {};

require('./icalLambda').handler(event, context, a => a);

