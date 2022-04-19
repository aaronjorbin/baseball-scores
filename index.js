// set dependency on axios
const axios = require('axios');
const { Console } = require('console');
const fs = require('fs');

const blankData = () => {
    return {
        0: false,
        1: false,
        2: false,
        3: false,
        4: false,
        5: false,
        6: false,
        7: false,
        8: false,
        9: false,
        10: false,
        11: false,
        12: false,
        13: false,
    }
}

// get /data/teams.json
const loadTeamsData = async () => {
    const data = fs.readFileSync('data/teams.json', 'utf8' );
    return JSON.parse(data);
}

// save the data to the file
const saveData = async (data) => {
    fs.writeFileSync('data/teams.json', JSON.stringify(data));
}

// fetch data from http://statsapi.mlb.com/api/v1/schedule/games/?sportId=1&startDate=2019-03-28&endDate=2019-09-29
// and return the data
const getGames = async () => {
    // start date of yesterday in format YYYY-MM-DD
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startDate = yesterday.toISOString().substring(0, 10);
    // end date of tomorrow in format YYYY-MM-DD
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const endDate = tomorrow.toISOString().substring(0, 10);
    // add the start and end date to the url
    const url = `http://statsapi.mlb.com/api/v1/schedule/games/?sportId=1&startDate=${startDate}&endDate=${endDate}`;
    // fetch the data
    const response = await axios.get(url);
    // return the data
    return response.data;
}

// filter the games and return each team and score as an object
const getTeamsResults = (data, log ) => {
    data.dates.forEach( date => { date.games.forEach( (game) => {
        if ( game.status.statusCode === 'F' && game.seriesDescription !== 'Spring Training' ) {
            if ( ! log[ game.teams.away.team.name ] ){
                log[ game.teams.away.team.name ] = blankData();
            }
            if ( ! log[ game.teams.home.team.name ] ){
                log[ game.teams.home.team.name ] = blankData();
            }
            // if away score is 13 or less
            if ( game.teams.away.score <= 13 ) {
                log[ game.teams.away.team.name ][ game.teams.away.score ] = true;
            }
            if ( game.teams.home.score <= 13 ) {
                log[ game.teams.home.team.name ][ game.teams.home.score ] = true;
            }
        }
    })});
    return log;
}

// async closure to get the data and return the teams and scores when file is called
const getData = async () => {

    const log = await loadTeamsData();
    // get the data
    const data = await getGames();
    // filter the data
    const teamsResults = getTeamsResults(data, log);

    // save the data
    await saveData(teamsResults);

    // return the data
    return teamsResults;
}

// call getData
getData().then( async (data) => {
    // check each team to see if they have won
    for ( let team in data ) {
        // filter the data to find all true
        const wins = Object.keys(data[team]).filter((score) => {
            return data[team][score] === true;
        });
        // log the team and the number of wins
        console.log(`${team} has ${wins.length} scores`);
        if ( wins.length >= 13) {
            // exit status 1
            process.exit(1);
        }
    }

    console.table( data );
});
