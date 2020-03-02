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
        displayInitialPlacementRange();
        updateQuizTotal();
        updateQuizPercent();
        updateRecommendations();
    });

    $('#initial-encore-level').on('input', () => {
        displayInitialPlacementRange();
        updateQuizTotal();
        updateQuizPercent();
        updateRecommendations();
    });

    $('#initial-goal').on('input', () => {
        updateRecommendations();
    });

    // Live-updating averages for cold timing, practices, hot timing - 3 fields each
    ['cold-timing', 'num-practices', 'hot-timing'].forEach((category) => {
        [1, 2, 3].forEach((number) => {
            $('#' + category + '-' + number).on('input', () => {
                calculateAvg(category);
                updateRecommendations();
            });
        });
    });

    $('#quiz-correct').on('input', updateQuizPercent);

    recalculate();
}

function calculateAvg(whatToAvg) {
    const av1 = Number($('#' + whatToAvg + '-1').val());
    const av2 = Number($('#' + whatToAvg + '-2').val());
    const av3 = Number($('#' + whatToAvg + '-3').val());
    const avg = $('#' + whatToAvg + '-average');

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
    displayInitialPlacementRange();
    ['cold-timing', 'num-practices', 'hot-timing'].forEach((avg) => calculateAvg(avg));
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

function displayInitialPlacementRange() {
    const level = $('#initial-encore-level').val();
    const initialPlacementRange = calculatePlacementRange(level);

    if (initialPlacementRange.min === '' || initialPlacementRange.max === '') {
        $('#initial-placement-range').val('Need valid level');
        return;
    }

    $('#initial-placement-range').val(initialPlacementRange.min + ' - ' + initialPlacementRange.max);
}

function calculatePlacementRange(level) {

    let placementRange = {
        'min': '',
        'max': ''
    };

    if (!($.isNumeric(level))) {
        placementRange.min = '';
        placementRange.max = '';
    } else if (Number(level) < 3.5) {
        placementRange.min = 30;
        placementRange.max = 60;
    } else if (Number(level) < 5.6) {
        placementRange.min = 60;
        placementRange.max = 80;
    } else if (Number(level) < 8.0) {
        placementRange.min = 80;
        placementRange.max = 100;
    } else {
        placementRange.min = 100;
        placementRange.max = 140;
    }

    return placementRange;
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

    $('#quiz-percent').val(formatNumberTwoDecimals(quizCorrect / quizTotal * 100) + '%');

    updateRecommendations();
}

function updateRecommendations() {
    const initialPlacementRange = calculatePlacementRange($('#initial-encore-level').val());
    const quizPercent = $('#quiz-percent').val().split('%')[0];
    const avgColdTiming = $('#cold-timing-average').val();

    let levelRows = $('#check-il tr');
    $(levelRows).find('.' + highlightClass).removeClass(highlightClass);
    clearLevelRecommendation();

    if (initialPlacementRange.min === '' || initialPlacementRange.max === '' || !$.isNumeric(quizPercent) || !$.isNumeric(avgColdTiming)) return;

    let row;
    let column;

    if (quizPercent >= 80) {
        column = 1;
    } else if (quizPercent >= 60) {
        column = 2;
    } else {
        column = 3;
    }

    if (avgColdTiming > initialPlacementRange.max) {
        row = 1;
    } else if (avgColdTiming >= initialPlacementRange.min) {
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
    let levelRecommendation = '';

    if (levelDirection < 0) {
        const newLevel = lowerLevelRecommendations[level];

        if (newLevel === level) {
            levelDirection = 0;
        } else {
            levelRecommendation = 'Lower level to ' + newLevel;
            if (column > 1) {
                levelRecommendation += (series === 'pho' ? ', ' : ' and ');
                levelRecommendation += 'provide comprehension support';
            }
            if (series === 'pho') {
                levelRecommendation += (column > 1 ? ', and ' : ' and ');
                levelRecommendation += 'provide separate phonics support';
            }
            levelRecommendation += '.';
        }
    }

    if (levelDirection > 0) {
        const newLevel = raiseLevelRecommendations[level];

        if (newLevel === level) {
            levelDirection = 0;
        } else {
            levelRecommendation = 'Raise level to ' + newLevel + '.';
            if (series === 'pho') {
                levelRecommendation += ' If appropriate, provide separate phonics support.';
            }
        }
    }

    if (levelDirection === 0) {
        levelRecommendation = 'Continue level ' + level + (column > 1 ? ' and provide comprehension support.' : '.');
    }

    $('#level-recommendation').text(levelRecommendation);

    calculateGoal(levelDirection);
}

function clearLevelRecommendation() {
    $('#level-recommendation').text('');
}

function calculateGoal(levelDirection) {

    let goalRows = $('#check-ig tr');
    $(goalRows).find('.' + highlightClass).removeClass(highlightClass);
    clearGoalRecommendation();

    if (levelDirection !== 0) {
        $('#goal-recommendation').text(
            'Calculate a new goal for the student\'s new level. After the student completes the first ' +
            'Cold Timing in the new level, take that score, then add 30 (for grades 1 - 4) or 40 ' +
            '(for grades 5+) and round down to the nearest five. '
        );
        $('#goal-too-high-signs').text('N/A');
        $('#goal-appropriate-signs').text('N/A');
        $('#goal-too-low-signs').text('N/A');
        return;
    }
    let levelTooLowSigns = 0;
    let levelAppropriateSigns = 0;
    let levelTooHighSigns = 0;

    const initialGoal = $('#initial-goal').val();
    const grade = $('#grade-level').val();
    const avgColdTiming = $('#cold-timing-average').val();
    const avgHotTiming = $('#hot-timing-average').val();
    const avgNumPractices = $('#num-practices-average').val();

    $('#goal-minus-cold-timing').html('Goal&nbsp;(' + initialGoal + ') - Average&nbsp;Cold&nbsp;Timing&nbsp;(' + 
        formatNumberTwoDecimals(avgColdTiming) + ') = ' + formatNumberTwoDecimals(initialGoal - avgColdTiming));
    $('#hot-timing-minus-goal').html('Average&nbsp;Hot&nbsp;Timing&nbsp;(' + formatNumberTwoDecimals(avgHotTiming) +
        ') - Goal&nbsp;(' + initialGoal + ') = ' + formatNumberTwoDecimals(avgHotTiming - initialGoal));
    $('#average-num-practices').text('Average # Practices (' + formatNumberTwoDecimals(avgNumPractices) + ')');

    if (initialGoal - avgColdTiming <= (grade > 4 ? 35 : 25)) {
        $(goalRows[1]).find('td')[1].classList.add(highlightClass);
        levelTooLowSigns++;
    } else if (initialGoal - avgColdTiming <= (grade > 4 ? 45 : 35)) {
        $(goalRows[1]).find('td')[2].classList.add(highlightClass);
        levelAppropriateSigns++;
    } else {
        $(goalRows[1]).find('td')[3].classList.add(highlightClass);
        levelTooHighSigns++;
    }

    if ((avgHotTiming - initialGoal) > 10) {
        $(goalRows[2]).find('td')[1].classList.add(highlightClass);
        levelTooLowSigns++;
    } else if ((avgHotTiming - initialGoal) >= 0) {
        $(goalRows[2]).find('td')[2].classList.add(highlightClass);
        levelAppropriateSigns++;
    } else {
        $(goalRows[2]).find('td')[3].classList.add(highlightClass);
        levelTooHighSigns++;
    }

    if (avgNumPractices < 3) {
        $(goalRows[3]).find('td')[1].classList.add(highlightClass);
        levelTooLowSigns++;
    } else if (avgNumPractices <= 10) {
        $(goalRows[3]).find('td')[2].classList.add(highlightClass);
        levelAppropriateSigns++;
    } else {
        $(goalRows[3]).find('td')[3].classList.add(highlightClass);
        levelTooHighSigns++;
    }

    $('#goal-too-high-signs').text(levelTooHighSigns);
    $('#goal-appropriate-signs').text(levelAppropriateSigns);
    $('#goal-too-low-signs').text(levelTooLowSigns);

    updateGoalRec(levelTooLowSigns, levelAppropriateSigns, levelTooHighSigns);
}

function formatNumberTwoDecimals(num) {
    return Number(num).toLocaleString('en-US', {
        maximumFractionDigits: 2,
    })
}

function updateGoalRec(tooLowSigns, apprSigns, tooHighSigns) {
    const goalRecommendationSpan = $('#goal-recommendation');

    if ((tooLowSigns + apprSigns + tooHighSigns) !== 3) {
        goalRecommendationSpan.text(
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
    $('#goal-recommendation').text(makeGoalRecommendationString(tooHighSigns - tooLowSigns));
}

function makeGoalRecommendationString(goalVector) {
    let goalRecommendation = '';
    let grade = $('#grade-level option:selected').val();
    const initialGoal = $('#initial-goal').val();
    const adjustAmount = (grade > 4) ? 40 : 30;
    const avgColdTiming = Number($('#cold-timing-average').val());
    const avgHotTiming = Number($('#hot-timing-average').val());
    const adjustedColdTiming = avgColdTiming + adjustAmount;
    const roundedGoal = Math.floor((avgColdTiming + adjustAmount) / 5) * 5

    if (grade === 'K' || grade < 5) {
        grade = '4 or lower';
    } else {
        grade = '5 or higher';
    }

    if (goalVector < -1) {
        goalRecommendation = 'Raise the student\'s goal. To ';
    }

    if (goalVector === -1) {
        goalRecommendation =
            'Based on what you know of the student, raise or continue the student\'s goal. If you raise the goal, to ';
    }

    if (goalVector === 0) {
        return 'Continue the student\'s current goal of ' + initialGoal + '.';
    }

    if (goalVector === 1) {
        goalRecommendation =
            'Based on what you know of the student, lower or continue the student\'s goal. If you lower the goal, to ';
    }

    if (goalVector > 1) {
        goalRecommendation = 'Lower the student\'s goal. To ';
    }

    goalRecommendation += 'calculate a new goal for a student in grade ' + grade + ', add ' + adjustAmount +
        ' to the Average Cold Timing and round down to the nearest five: ' + formatNumberTwoDecimals(avgColdTiming) + ' + ' + adjustAmount +
        ' = ' + adjustedColdTiming;

    if (adjustedColdTiming !== roundedGoal) {
        goalRecommendation += ', rounded down = ' + roundedGoal + '. '
    } else {
        goalRecommendation += '. ';
    }

    if (roundedGoal > avgHotTiming) {
        goalRecommendation += 'However, the new goal should not exceed the average hot timing, so in this case ' +
            'we would recommend a goal of ' + (Math.floor(avgHotTiming / 5) * 5) + ' instead. ';
    }

    goalRecommendation += 'Recheck the goal after the next three stories.';

    return goalRecommendation;
}

function clearGoalRecommendation() {
    $('#goal-recommendation').text('');
}