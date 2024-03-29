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

const highlightClass = 'table-green font-weight-bold';

$(document).ready(initDocument);

function initDocument() {
    $('#grade-level').on('input', () => {
        updateRecommendations();
    });

    $('#initial-goal').on('input', () => {
        updateRecommendations();
    });

    ['grade-level', 'initial-goal', 'cold-timing-average', 'num-practices-average',
     'hot-timing-average', 'quiz-percent'].forEach((category) => {
         $('#' + category).on('input', () => {
             updateRecommendations();
         })
     });

    $('#initial-encore-series').on('input', () => {
        updateAvailableLevels();
        updateInitialPlacementRange();
        updateRecommendations();
    });

    $('#initial-encore-level').on('input', () => {
        updateInitialPlacementRange();
        updateRecommendations();
    });

    recalculate();
}


function recalculate() {
    updateAvailableLevels();
    updateInitialPlacementRange();
    updateRecommendations();
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

function updateInitialPlacementRange() {
    const level = $('#initial-encore-level').val();
    const initialPlacementRange = calculatePlacementRange(level);

    if (initialPlacementRange.min === '' || initialPlacementRange.max === '') {
        $('#initial-placement-range').val('??');
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

    if (!validLevels.hasOwnProperty(series) ||
        !validLevels[series].includes(level)) {
        quizTotal.val('??');
        return;
    }

    let index = validLevels[series].indexOf(level);
    let newNumQuestions = numQuizQuestions[series][index];

    quizTotal.val(newNumQuestions);

    [1, 2, 3].forEach((number) => {
        let quizCorrect = $('#quiz-correct' + number);
        if (quizCorrect.val() > newNumQuestions) {
            quizCorrect.val(newNumQuestions);
        }
        quizCorrect.attr('max', newNumQuestions);
    });
}

function updateQuizPercent() {
    const quizTotal = Number($('#quiz-total').val());
    const quizCorrect = (Number($('#quiz-correct1').val()) +
                         Number($('#quiz-correct2').val()) +
                         Number($('#quiz-correct3').val())) / 3.0;

    if (!(quizTotal > 0)) {
        $('#quiz-percent').val('---');
        return;
    }

    $('#quiz-percent').val(formatNumberTwoDecimals(quizCorrect / quizTotal * 100) + '%');
}

function updateRecommendations() {
    const initialPlacementRange = calculatePlacementRange($('#initial-encore-level').val());
    const quizPercent = $('#quiz-percent').val().split('%')[0];
    const avgColdTiming = $('#cold-timing-average').val();

    let levelRows = $('#check-il tr');
    $(levelRows).find('*').removeClass(highlightClass);
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

    // Highlight the appropriate cell in the level calculations chart
    $($(levelRows[row]).find('td')[column]).addClass(highlightClass);

    const levelDirection = recommendationChart[row - 1][column - 1];
    const needComprehensionSupport = (column > 1);
    makeLevelRec(levelDirection, needComprehensionSupport);
    makeGoalRec(levelDirection);
}

function makeLevelRec(levelDirection, needComprehensionSupport) {
    const level = $('#initial-encore-level').val();
    const series = $('#initial-encore-series').val();
    let levelRecommendation = '';

    if (levelDirection < 0) {
        const newLevel = lowerLevelRecommendations[level];

        // Use == here because we want type conversion as needed
        if (newLevel == level) {
            levelDirection = 0;
        } else {
            levelRecommendation = 'Lower level to ' + newLevel;
            if (needComprehensionSupport) {
                levelRecommendation += (series === 'pho' ? ', ' : ' and ');
                levelRecommendation += 'provide comprehension support';
            }
            if (series === 'pho') {
                levelRecommendation += (needComprehensionSupport ? ', and ' : ' and ');
                levelRecommendation += 'provide separate phonics support';
            }
            levelRecommendation += '.';
        }
    }

    if (levelDirection > 0) {
        const newLevel = raiseLevelRecommendations[level];

        // Use == here because we want type conversion as needed
        if (newLevel == level) {
            levelDirection = 0;
        } else {
            levelRecommendation = 'Raise level to ' + newLevel + '.';
            if (series === 'pho') {
                levelRecommendation += ' If appropriate, provide separate phonics support.';
            }
        }
    }

    if (levelDirection === 0) {
        levelRecommendation = 'Continue level ' + level + (needComprehensionSupport ? ' and provide comprehension support.' : '.');
    }

    $('#level-recommendation').text(levelRecommendation);

}

function clearLevelRecommendation() {
    $('#level-recommendation').text('');
}

function makeGoalRec(levelDirection) {

    let goalRows = $('#check-ig tr');
    $(goalRows).find('*').removeClass(highlightClass);
    clearGoalRecommendation();

    if (levelDirection !== 0) {
        $('#advanced-goal-recommendation').text(
            'Calculate a new goal for the student\'s new level. After the student completes the first ' +
            'Cold Timing in the new level, take that score, then add 30 (for grades 4 and lower) or 40 ' +
            '(for grades 5 and higher) and round down to the nearest five. '
        );
        $('#goal-recommendation').text(
            'Calculate a new goal from the first Cold Timing in the new level.'
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

    $('#goal-minus-cold-timing').html('Initial&nbsp;Goal (' + initialGoal + ') - Average&nbsp;Cold&nbsp;Timing&nbsp;(' +
        formatNumberTwoDecimals(avgColdTiming) + ') = ' + formatNumberTwoDecimals(initialGoal - avgColdTiming));
    $('#hot-timing-minus-goal').html('Average&nbsp;Hot&nbsp;Timing&nbsp;(' + formatNumberTwoDecimals(avgHotTiming) +
        ') - Initial&nbsp;Goal (' + initialGoal + ') = ' + formatNumberTwoDecimals(avgHotTiming - initialGoal));
    $('#average-num-practices').text('Average # Practices (' + formatNumberTwoDecimals(avgNumPractices) + ')');

    if (initialGoal - avgColdTiming <= (grade > 4 ? 35 : 25)) {
        $($(goalRows[1]).find('td')[1]).addClass(highlightClass);
        levelTooLowSigns++;
    } else if (initialGoal - avgColdTiming <= (grade > 4 ? 45 : 35)) {
        $($(goalRows[1]).find('td')[2]).addClass(highlightClass);
        levelAppropriateSigns++;
    } else {
        $($(goalRows[1]).find('td')[3]).addClass(highlightClass);
        levelTooHighSigns++;
    }

    if ((avgHotTiming - initialGoal) > 10) {
        $($(goalRows[2]).find('td')[1]).addClass(highlightClass);
        levelTooLowSigns++;
    } else if ((avgHotTiming - initialGoal) >= 0) {
        $($(goalRows[2]).find('td')[2]).addClass(highlightClass);
        levelAppropriateSigns++;
    } else {
        $($(goalRows[2]).find('td')[3]).addClass(highlightClass);
        levelTooHighSigns++;
    }

    if (avgNumPractices < 3) {
        $($(goalRows[3]).find('td')[1]).addClass(highlightClass);
        levelTooLowSigns++;
    } else if (avgNumPractices <= 10) {
        $($(goalRows[3]).find('td')[2]).addClass(highlightClass);
        levelAppropriateSigns++;
    } else {
        $($(goalRows[3]).find('td')[3]).addClass(highlightClass);
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
    let recommendationStrings;
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
    const goalVector = tooHighSigns - tooLowSigns;

    if ((tooLowSigns + apprSigns + tooHighSigns) !== 3) {
        goalRecommendationSpan.text(
            'An error occurred calculating the goal recommendation (indicators must add up to 3).');
        return;
    }

    recommendationStrings = makeGoalRecommendationStrings(goalVector);
    $('#goal-recommendation').text(recommendationStrings[0]);
    $('#advanced-goal-recommendation').text(recommendationStrings[1]);
}

function makeGoalRecommendationStrings(goalVector) {
    let goalRecommendation = '';
    let advancedGoalRecommendation = '';
    let gradePhrase = '';
    let addPhrase = '';
    const recheckPhrase = 'Recheck the goal after the next three stories.'
    const grade = $('#grade-level option:selected').val();
    const initialGoal = $('#initial-goal').val();
    const adjustAmount = (grade > 4) ? 40 : 30;
    const avgColdTiming = Number($('#cold-timing-average').val());
    const avgHotTiming = Number($('#hot-timing-average').val());
    const adjustedColdTiming = avgColdTiming + adjustAmount;
    let roundedGoal = Math.floor((avgColdTiming + adjustAmount) / 5) * 5

    if (goalVector < -1) {
        goalRecommendation = 'Raise the student\'s goal to ';
        addPhrase = 'Raise the student\'s goal. Add ';
    }

    if (goalVector === -1) {
        goalRecommendation = 'Based on what you know of the student, continue the current goal or raise to ';
            addPhrase = 'Based on what you know of the student, raise or continue the student\'s goal. If you raise the goal, add ';
    }

    if (goalVector === 0 || roundedGoal === initialGoal) {
        const returnPhrase = 'Continue the student\'s current goal of ' + initialGoal + '.';
        return [ returnPhrase, returnPhrase ];
    }

    if (goalVector === 1) {
        goalRecommendation = 'Based on what you know of the student, continue the current goal or lower to ';
            addPhrase = 'Based on what you know of the student, lower or continue the student\'s goal. If you lower the goal, add ';
    }

    if (goalVector > 1) {
        goalRecommendation = 'Lower the student\'s goal to ';
        addPhrase = 'Lower the student\'s goal. Add ';
    }

    if (grade === 'K' || grade < 5) {
        gradePhrase = 'grade 4 or lower';
    } else {
        gradePhrase = 'grade 5 or higher';
    }

    advancedGoalRecommendation += addPhrase + adjustAmount + ' (for a student in ' + gradePhrase + ')' + ' to the Average Cold Timing ' +
        'and round down to the nearest five: ' + formatNumberTwoDecimals(avgColdTiming) + ' + ' + adjustAmount + ' = ' +
        adjustedColdTiming;

    if (adjustedColdTiming !== roundedGoal) {
        advancedGoalRecommendation += ', rounded down = ' + roundedGoal + '. '
    } else {
        advancedGoalRecommendation += '. ';
    }

    if (roundedGoal > avgHotTiming) {
        roundedGoal = (Math.floor(avgHotTiming / 5) * 5);
        advancedGoalRecommendation += 'However, the new goal should not exceed the average hot timing, so in this case ' +
            'we would recommend a goal of ' + roundedGoal + ' instead. ';
    }

    goalRecommendation += roundedGoal + '. ';

    goalRecommendation += recheckPhrase;
    advancedGoalRecommendation += recheckPhrase;

    return [ goalRecommendation, advancedGoalRecommendation ];
}

function clearGoalRecommendation() {
    $('#goal-recommendation').text('');
    $('#goal-minus-cold-timing').html('Initial&nbsp;Goal - Average&nbsp;Cold&nbsp;Timing');
    $('#hot-timing-minus-goal').html('Average&nbsp;Hot&nbsp;Timing - Initial&nbsp;Goal');
    $('#average-num-practices').html('Average #&nbsp;Practices');
}
