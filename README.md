# Chat Gun Socket Testing Project
## bugs
1. Comparing a string with an ObjectId doesn't throw an error, rather sends an empty array in the aggregated output document. So you need to make sure that you have converted the string object id to mongodb's ObjectId:

            { $set: { creatorId: { $toObjectId: "$creatorId" } } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'creatorId',
                    foreignField: '_id',
                    as: 'user'
                }
