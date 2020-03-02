'use strict';

const validLevels = {
    'seq': ['1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0', '5.6', '6.0', '7.0', '8.0'],
    'pho': ['0.8', '1.3', '1.8', '2.3', '2.6', '2.7'],
    'idi': ['3.0', '3.5', '4.0', '4.5']
}

const numQuizQuestions = {
    'seq': [5, 5, 5, 5, 5, 6, 7, 7, 7, 9, 9, 9, 9],
    'pho': [5, 5, 5, 5, 5, 5],
    'idi': [7, 7, 7, 7]
}

const raiseLevelRecommendations = {
    '0.8': '1.5',
    '1.0': '1.5',
    '1.3': '2.0',
    '1.5': '2.0',
    '1.8': '2.5',
    '2.0': '2.5',
    '2.3': '3.0',
    '2.5': '3.0',
    '2.6': '3.5',
    '2.7': '3.5',
    '3.0': '3.5',
    '3.5': '4.0',
    '4.0': '4.5',
    '4.5': '5.0',
    '5.0': '5.6',
    '5.6': '6.0',
    '6.0': '7.0',
    '7.0': '8.0',
    '8.0': '8.0'
}

const lowerLevelRecommendations = {
    '0.8': '0.8',
    '1.0': '0.8',
    '1.3': '1.0',
    '1.5': '1.0',
    '1.8': '1.5',
    '2.0': '1.5',
    '2.3': '2.0',
    '2.5': '2.0',
    '2.6': '2.5',
    '2.7': '2.5',
    '3.0': '2.5',
    '3.5': '3.0',
    '4.0': '3.5',
    '4.5': '4.0',
    '5.0': '4.5',
    '5.6': '5.0',
    '6.0': '5.6',
    '7.0': '6.0',
    '8.0': '7.0'
}

const recommendationChart = [
    [1, 0, -1],
    [0, 0, -1],
    [-1, -1, -1]
]

const highlightClass = 'table-success';

$(document).ready(initDocument);

function initDocument() {
    $('#grade-level').on('input', () => {
        updateRecommendations();
    });

    $('#initial-encore-series').on('input', () => {
        updateAvailableLevels();
        displayIPR();
        updateQuizTotal();
        updateQuizPercent();
        updateRecommendations();
    });

    $('#initial-encore-level').on('input', () => {
        displayIPR();
        updateQuizTotal();
        updateQuizPercent();
        updateRecommendations();
    });

    $('#initial-goal').on('input', () => {
        updateRecommendations();
    });

    $('#ct-1').on('input', () => {
        calculateAvg('ct');
        updateRecommendations();
    });
    $('#ct-2').on('input', () => {
        calculateAvg('ct');
        updateRecommendations();
    });
    $('#ct-3').on('input', () => {
        calculateAvg('ct');
        updateRecommendations();
    });

    $('#pr-1').on('input', () => {
        calculateAvg('pr');
        updateRecommendations();
    });
    $('#pr-2').on('input', () => {
        calculateAvg('pr');
        updateRecommendations();
    });
    $('#pr-3').on('input', () => {
        calculateAvg('pr');
        updateRecommendations();
    });

    $('#ht-1').on('input', () => {
        calculateAvg('ht');
        updateRecommendations();
    });
    $('#ht-2').on('input', () => {
        calculateAvg('ht');
        updateRecommendations();
    });
    $('#ht-3').on('input', () => {
        calculateAvg('ht');
        updateRecommendations();
    });

    $('#quiz-correct').on('input', updateQuizPercent);

    recalculate();
}

function calculateAvg(whatToAvg) {
    const av1 = Number($('#' + whatToAvg + '-1').val());
    const av2 = Number($('#' + whatToAvg + '-2').val());
    const av3 = Number($('#' + whatToAvg + '-3').val());
    const avg = $('#' + whatToAvg + '-avg');

    if (av1 === 0 || av2 === 0 || av3 === 0) {
        avg.val('Need 3 entries');
        return;
    }

    avg.val(Number((av1 + av2 + av3) / 3).toLocaleString('en-US', {
        maximumFractionDigits: 2
    }));
}

function recalculate() {
    updateAvailableLevels();
    displayIPR();
    ['ct', 'pr', 'ht'].forEach((avg) => calculateAvg(avg));
    updateQuizTotal();
    updateQuizPercent();
    updateRecommendations();
    updateQuizTotal();
}

function updateAvailableLevels() {
    const series = $('#initial-encore-series').val();
    const levelMenu = $('#initial-encore-level');
    const oldLevel = levelMenu.val();

    levelMenu.empty();

    if (validLevels.hasOwnProperty(series)) {
        for (let i = 0; i < validLevels[series].length; i++) {
            levelMenu.append($("<option></option>")
                .attr('value', validLevels[series][i])
                .text(validLevels[series][i]));
        }

        // Default to nearest possible level in new series
        levelMenu.val(validLevels[series].reduce((prev, curr) => {
            return (Math.abs(curr - oldLevel) < Math.abs(prev - oldLevel) ? curr : prev);
        }));
    }


}

function displayIPR() {
    const level = $('#initial-encore-level').val();
    const iprTextBox = $('#initial-placement-range');
    const ipr = calculateIPR(level);

    if (ipr.min === '' || ipr.max === '') {
        iprTextBox.val('Need valid level');
        return;
    }

    iprTextBox.val(ipr.min + ' - ' + ipr.max);
}

function calculateIPR(level) {

    let ipr = {
        'min': '',
        'max': ''
    };

    if (!($.isNumeric(level))) {
        ipr.min = '';
        ipr.max = '';
        return ipr;
    }

    if (Number(level) < 3.5) {
        ipr.min = 30;
        ipr.max = 60;
        return ipr;
    }

    if (Number(level) < 5.6) {
        ipr.min = 60;
        ipr.max = 80;
        return ipr;
    }

    if (Number(level) < 8.0) {
        ipr.min = 80;
        ipr.max = 100;
        return ipr;
    }

    ipr.min = 100;
    ipr.max = 140;
    return ipr;
}

function updateQuizTotal() {
    const level = $('#initial-encore-level').val();
    const series = $('#initial-encore-series').val();
    const quizTotal = $('#quiz-total');
    const quizCorrect = $('#quiz-correct');

    if (!validLevels.hasOwnProperty(series) ||
        !validLevels[series].includes(level)) {
        quizTotal.val('Need valid level');
        return;
    }

    let index = validLevels[series].indexOf(level);
    let newNumQuestions = numQuizQuestions[series][index];

    quizTotal.val(newNumQuestions);
    if (quizCorrect.val() > newNumQuestions) {
        quizCorrect.val(newNumQuestions);
    }

    quizCorrect.attr('max', newNumQuestions);
}

function updateQuizPercent() {
    const quizTotal = Number($('#quiz-total').val());
    const quizCorrect = Number($('#quiz-correct').val());

    if (!(quizTotal > 0)) {
        $('#quiz-percent').val('---');
        return;
    }

    $('#quiz-percent').val((quizCorrect / quizTotal).toLocaleString('en-US', {
        maximumFractionDigits: 2,
        style: 'percent'
    }));

    updateRecommendations();
}

function updateRecommendations() {
    const ipr = calculateIPR($('#initial-encore-level').val());
    const quizPercent = $('#quiz-percent').val().split('%')[0];
    const avgCT = $('#ct-avg').val();

    let levelRows = $('#check-il tr');
    $(levelRows).find('.' + highlightClass).removeClass(highlightClass);
    clearLevelRec();

    if (ipr.min === '' || ipr.max === '' || !$.isNumeric(quizPercent) || !$.isNumeric(avgCT)) return;

    let row;
    let column;

    if (quizPercent >= 80) {
        column = 1;
    } else if (quizPercent >= 60) {
        column = 2;
    } else {
        column = 3;
    }

    if (avgCT > ipr.max) {
        row = 1;
    } else if (avgCT >= ipr.min) {
        row = 2;
    } else {
        row = 3;
    }

    $(levelRows[row]).find('td')[column].classList.add(highlightClass);
    makeLevelRec(row, column);
}

function makeLevelRec(row, column) {
    const level = $('#initial-encore-level').val();
    const series = $('#initial-encore-series').val();
    let levelDirection = recommendationChart[row - 1][column - 1];
    let recText = '';

    if (levelDirection < 0) {
        const newLevel = lowerLevelRecommendations[level];

        if (newLevel === level) {
            levelDirection = 0;
        } else {
            recText = 'Lower level to ' + newLevel;
            if (column > 1) {
                recText += (series === 'pho' ? ', ' : ' and ');
                recText += 'provide comprehension support';
            }
            if (series === 'pho') {
                recText += (column > 1 ? ', and ' : ' and ');
                recText += 'provide separate phonics support';
            }
            recText += '.';
        }
    }

    if (levelDirection > 0) {
        const newLevel = raiseLevelRecommendations[level];

        if (newLevel === level) {
            levelDirection = 0;
        } else {
            recText = 'Raise level to ' + newLevel + '.';
            if (series === 'pho') {
                recText += ' If appropriate, provide separate phonics support.';
            }
        }
    }

    if (levelDirection === 0) {
        recText = 'Continue level ' + level + (column > 1 ? ' and provide comprehension support.' : '.');
    }

    $('#level-recommendation').text(recText);

    calculateGoal(levelDirection);
}

function clearLevelRec() {
    $('#level-recommendation').text('');
}

function calculateGoal(levelDirection) {

    let goalRows = $('#check-ig tr');
    $(goalRows).find('.' + highlightClass).removeClass(highlightClass);
    clearGoalRec();

    if (levelDirection !== 0) {
        $('#goal-recommendation').text(
            'Calculate a new goal for the student\'s new level. After the student completes the first ' +
            'Cold Timing, take that score, then add 30 (for grades 1 - 4) or 40 (for grades 5+) and round ' +
            'down to the nearest five. '
        );
        $('#too-high-signs').text('N/A');
        $('#appr-signs').text('N/A');
        $('#too-low-signs').text('N/A');
        return;
    }
    let tooLowSigns = 0;
    let apprSigns = 0;
    let tooHighSigns = 0;

    const ig = $('#initial-goal').val();
    const grade = $('#grade-level').val();
    const avgCT = $('#ct-avg').val();
    const avgHT = $('#ht-avg').val();
    const avgPr = $('#pr-avg').val();

    $('#ig-act').html('Goal&nbsp;(' + ig + ') - Average&nbsp;Cold&nbsp;Timing&nbsp;(' + fmt(avgCT) + ') = ' +
        fmt(ig - avgCT));
    $('#aht-ig').html('Average&nbsp;Hot&nbsp;Timing&nbsp;(' + fmt(avgHT) + ') - Goal&nbsp;(' + ig + ') = ' +
        fmt(avgHT - ig));
    $('#avgPr-table').text('Average # Practices (' + fmt(avgPr) + ')');

    if (ig - avgCT <= (grade > 4 ? 35 : 25)) {
        $(goalRows[1]).find('td')[1].classList.add(highlightClass);
        tooLowSigns++;
    } else if (ig - avgCT <= (grade > 4 ? 45 : 35)) {
        $(goalRows[1]).find('td')[2].classList.add(highlightClass);
        apprSigns++;
    } else {
        $(goalRows[1]).find('td')[3].classList.add(highlightClass);
        tooHighSigns++;
    }

    if ((avgHT - ig) > 10) {
        $(goalRows[2]).find('td')[1].classList.add(highlightClass);
        tooLowSigns++;
    } else if ((avgHT - ig) >= 0) {
        $(goalRows[2]).find('td')[2].classList.add(highlightClass);
        apprSigns++;
    } else {
        $(goalRows[2]).find('td')[3].classList.add(highlightClass);
        tooHighSigns++;
    }

    if (avgPr < 3) {
        $(goalRows[3]).find('td')[1].classList.add(highlightClass);
        tooLowSigns++;
    } else if (avgPr <= 10) {
        $(goalRows[3]).find('td')[2].classList.add(highlightClass);
        apprSigns++;
    } else {
        $(goalRows[3]).find('td')[3].classList.add(highlightClass);
        tooHighSigns++;
    }

    $('#too-high-signs').text(tooHighSigns);
    $('#appr-signs').text(apprSigns);
    $('#too-low-signs').text(tooLowSigns);

    updateGoalRec(tooLowSigns, apprSigns, tooHighSigns);
}

function fmt(num) {
    return Number(num).toLocaleString('en-US', {
        maximumFractionDigits: 2,
    })
}

function updateGoalRec(tooLowSigns, apprSigns, tooHighSigns) {
    const goalRecSpan = $('#goal-recommendation');

    if ((tooLowSigns + apprSigns + tooHighSigns) !== 3) {
        goalRecSpan.text(
            'An error occurred calculating the goal recommendation (indicators must add up to 3).');
        return;
    }

    // Goal Adjustment:
    // TooLow   Appr   TooHigh   Action
    //   3        0       0      Raise
    //   2        1       0      Raise
    //   2        0       1      Continue or raise
    //   1        2       0      Continue or raise
    //   0        3       0      Continue
    //   1        1       1      Continue
    //   0        2       1      Continue or lower
    //   1        0       2      Continue or lower
    //   0        1       2      Lower
    //   0        0       3      Lower
    //
    // This boils down to some very simple arithmetic:

    $('#goal-recommendation').text(makeGoalRecString(tooHighSigns - tooLowSigns));
}

function makeGoalRecString(goalVector) {
    let goalRecString = '';
    let grade = $('#grade-level option:selected').val();
    const initialGoal = $('#initial-goal').val();
    const adjustAmt = (grade > 4) ? 40 : 30;
    const avgCT = Number($('#ct-avg').val());
    const avgHT = Number($('#ht-avg').val());
    const adjustedCT = avgCT + adjustAmt;
    const roundedGoal = Math.floor((avgCT + adjustAmt) / 5) * 5

    if (grade === 'K' || grade < 5) {
        grade = '4 or lower';
    } else {
        grade = '5 or higher';
    }

    if (goalVector < -1) {
        goalRecString = 'Raise the student\'s goal. To ';
    }

    if (goalVector === -1) {
        goalRecString =
            'Based on what you know of the student, raise or continue the student\'s goal. If you raise the goal, to ';
    }

    if (goalVector === 0) {
        return 'Continue the student\'s current goal of ' + initialGoal + '.';
    }

    if (goalVector === 1) {
        goalRecString =
            'Based on what you know of the student, lower or continue the student\'s goal. If you lower the goal, to ';
    }

    if (goalVector > 1) {
        goalRecString = 'Lower the student\'s goal. To ';
    }

    goalRecString += 'calculate a new goal for a student in grade ' + grade + ', add ' + adjustAmt +
        ' to the Average Cold Timing and round down to the nearest five: ' + fmt(avgCT) + ' + ' + adjustAmt +
        ' = ' + adjustedCT;

    if (adjustedCT !== roundedGoal) {
        goalRecString += ', rounded down = ' + roundedGoal + '. '
    } else {
        goalRecString += '. ';
    }

    if (roundedGoal > avgHT) {
        goalRecString += 'However, the new goal should not exceed the average hot timing, so in this case ' +
            'we would recommend a goal of ' + (Math.floor(avgHT / 5) * 5) + ' instead. ';
    }

    goalRecString += 'Recheck the goal after the next three stories.';

    return goalRecString;
}

function clearGoalRec() {
    $('#goal-recommendation').text('');
}