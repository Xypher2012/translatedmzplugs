//=============================================================================
// CustomizeCritical.js
// ----------------------------------------------------------------------------
// (C)2020 Triacontane
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
// ----------------------------------------------------------------------------
// Version
// 1.4.1 2022/01/30 Fixed an issue where critical hits would be judged even if the damage type of a skill was changed to "None" after setting the critical hit to "Yes."
// 1.4.0 2022/01/26 Added a function to suppress the default critical message when a dedicated critical message is displayed.
// 1.3.1 2021/08/22 Fixed an issue where sound effects were played even when it was not a critical hit due to the fix in 1.3.0.
// 1.3.0 2021/08/21 Added the ability to specify common formulas, sound effects, production animations, and messages from parameters.
// 1.2.0 2021/08/20 Fixed for MZ.
// 1.1.4 2020/07/11 Fixed an issue where critical hits were not being judged for each hit of multi-hit attacks.
// 1.1.3 2017/09/01 Fixed an issue where an error would occur if an enemy character executed an action such as "Wait" (by Tsumio).
// 1.1.2 2017/07/09 Fixed an incorrect description example for "<CC calculation formula: JavaScript calculation formula>" in the memo field of the help section.
// 1.1.1 2017/05/31 Fixed a bug where an error would occur when using a skill on the menu screen due to the fix in 1.1.0.
// 1.1.0 2017/05/27 Fixed an issue where damage from the second and subsequent hits of consecutive attacks was not displayed correctly. Resolved conflict with YEP_BattleEngineCore.js.
// 1.0.0 2016/05/05 First edition.
// ----------------------------------------------------------------------------
// [Blog]   : https://triacontane.blogspot.jp/
// [Twitter]: https://twitter.com/triacontane/
// [GitHub] : https://github.com/triacontane/
//=============================================================================

/*:
 * @plugindesc Critical Customization Plugin
 * @target MZ
 * @url https://github.com/triacontane/RPGMakerMV/tree/mz_master/CustomizeCritical.js
 * @base PluginCommonBase
 * @orderAfter PluginCommonBase
 * @author Triacontane
 *
 * @param commonFormula
 * @text Common Formula
 * @desc This is the common formula for when a critical hit occurs. If specified in the memo field, that will take precedence.
 * @default
 * @type multiline_string
 *
 * @param commonMessage
 * @text Common Message
 * @desc This is the common message for when a critical hit occurs. If specified in the memo field, that will take precedence.
 * @default
 *
 * @param commonAnimation
 * @text Common Animation
 * @desc This is the common animation for when a critical hit occurs. If specified in the memo field, that will take precedence.
 * @default 0
 * @type animation
 *
 * @param commonSe
 * @text Common Sound Effect
 * @desc This is the common sound effect to play when a critical hit occurs.
 * @default
 * @type struct<SE>
 *
 * @param suppressDefault
 * @text Suppress Default Message
 * @desc Suppresses the default critical message when a dedicated critical message is displayed.
 * @default false
 * @type boolean
 *
 * @help This plugin customizes the probability, damage, and effects of critical hits.
 *
 * Write the following in the skill's memo field:
 *
 * - Apply a dedicated formula to critical hits. The format is the same as the damage formula.
 *   If a formula is applied, the default damage triple is invalidated.
 *   The original damage value can be referenced from the local variable "normalDamage."
 * <CCFormula: JavaScript calculation formula>
 * Example: <CCFormula: a.atk * 4> // Attack power multiplied by 4, ignoring the opponent's defense.
 *
 * - Add to the critical hit probability. The calculation result is added to the original probability. (%)
 * <CCProbAdd: addition value>
 * Example: <CCProbAdd: 50> // Occurs with the original probability + 50%.
 *
 * - Change the critical hit probability. The original probability is ignored. (%)
 * <CCProbChange: change value>
 * Example: <CCProbChange: \v[1]> // Occurs with a probability equal to the value of variable [1].
 *
 * - Apply a dedicated battle animation when a critical hit occurs.
 * <CCAnimation: Battle Animation ID>
 *
 * Adds effects when a critical hit occurs. Write the following in the memo field of either the actor, class, enemy character, weapon, armor, or state.
 * However, enemy character animations are not displayed in front view.
 *
 * - Display a production battle animation before execution.
 * <CCAnimation: Battle Animation ID>
 *
 * - Display a dedicated message before execution.
 * <CCMessage: Message content>
 *
 * * In the case of skills that target all enemies or attack multiple times, if even one critical hit is judged,
 * critical hit effects will be applied.
 *
 * This plugin requires the base plugin 'PluginCommonBase.js'.
 * 'PluginCommonBase.js' is located in the following folder under the RPG Maker MZ installation folder:
 * dlc/BasicResources/plugins/official
 *
 * Terms of Use:
 *  Modification and redistribution are permitted without permission of the author, and there are no restrictions on usage (commercial use, use in R-18 works, etc.).
 *  This plugin is now yours.
 */

/*~struct~SE:
 *
 * @param name
 * @text SE File Name
 * @desc The file name of the SE.
 * @require 1
 * @dir audio/se/
 * @type file
 * @default
 *
 * @param volume
 * @text SE Volume
 * @desc The volume of the SE.
 * @type number
 * @default 90
 * @min 0
 * @max 100
 *
 * @param pitch
 * @text SE Pitch
 * @desc The pitch of the SE.
 * @type number
 * @default 100
 * @min 50
 * @max 150
 *
 * @param pan
 * @text SE Pan
 * @desc The pan of the SE.
 * @type number
 * @default 0
 * @min -100
 * @max 100
 */

(()=> {
    'use strict';
    const script = document.currentScript;
    const param = PluginManagerEx.createParameter(script);

    //=============================================================================
    // Game_Action
    //  Customizes critical hits.
    //=============================================================================
    const _Game_Action_evalDamageFormula      = Game_Action.prototype.evalDamageFormula;
    Game_Action.prototype.evalDamageFormula = function(target) {
        const formula = this.findCriticalFormula();
        const normalDamage = _Game_Action_evalDamageFormula.apply(this, arguments);
        if (formula && target.result().critical) {
            try {
                const a     = this.subject();
                const b     = target;
                const v     = $gameVariables._data;
                const sign  = ([3, 4].contains(this.item().damage.type) ? -1 : 1);
                const value = Math.max(eval(formula), 0) * sign;
                return isNaN(value) ? 0 : value;
            } catch (e) {
                return 0;
            }
        } else {
            return normalDamage;
        }
    };

    Game_Action.prototype.findCriticalFormula = function() {
        return PluginManagerEx.findMetaValue(this.item(), ['CC計算式', 'CCFormula']) || param.commonFormula;
    };

    const _Game_Action_itemCri            = Game_Action.prototype.itemCri;
    Game_Action.prototype.itemCri = function(target) {
        const queue = this._criticalQueue;
        if (queue && queue.length > 0) {
            return queue.shift() ? 1.0 : 0.0;
        } else {
            return _Game_Action_itemCri.apply(this, arguments);
        }
    };

    Game_Action.prototype.judgeCritical = function(target) {
        const changeValue = PluginManagerEx.findMetaValue(this.item(), ['CC確率変更', 'CCProbChange']);
        let itemCritical;
        if (changeValue) {
            itemCritical = changeValue / 100;
        } else {
            if (this.item().damage.type === 0) {
                return;
            }
            const addValue = PluginManagerEx.findMetaValue(this.item(), ['CC確率加算', 'CCProbAdd']);
            itemCritical = _Game_Action_itemCri.apply(this, arguments) + (addValue ? addValue / 100 : 0);
        }
        this._criticalQueue.push(Math.random() < itemCritical);
    };

    Game_Action.prototype.initCriticalQueue = function() {
        this._criticalQueue = [];
    };

    Game_Action.prototype.isCritical = function() {
        if (!this._criticalQueue) {
            return false;
        }
        return this._criticalQueue.some(function(critical) {
            return critical;
        })
    };

    const _Game_Action_applyCritical      = Game_Action.prototype.applyCritical;
    Game_Action.prototype.applyCritical = function(damage) {
        const formula = this.findCriticalFormula();
        return formula ? damage : _Game_Action_applyCritical.apply(this, arguments);
    };

    //=============================================================================
    // Game_Battler
    //  Acquires the data object.
    //=============================================================================
    Game_Battler.prototype.findCriticalEffect = function(tags) {
        let result = null;
        this.traitObjects().some(obj => {
            result = PluginManagerEx.findMetaValue(obj, tags);
            return result !== null;
        });
        return result;
    };

    //=============================================================================
    // BattleManager
    //  Determine critical hits in advance.
    //=============================================================================
    BattleManager.judgeCritical = function(action, targets) {
        action.initCriticalQueue();
        targets.forEach(function(target) {
            action.judgeCritical(target);
        });
    };

    //=============================================================================
    // Window_BattleLog
    //  Adds additional definitions for critical hit effects.
    //=============================================================================
    const _Window_BattleLog_startAction      = Window_BattleLog.prototype.startAction;
    Window_BattleLog.prototype.startAction = function(subject, action, targets) {
        this._noCritialAnimationId = 0;
        this._currentAction = action;
        BattleManager.judgeCritical(action, targets);
        if (action.isCritical()) {
            this.showCriticalEffect(subject);
            const animationId = PluginManagerEx.findMetaValue(action.item(), ['CCアニメ', 'CCAnimation']);
            if (animationId) {
                this._noCritialAnimationId = action.item().animationId;
                action.item().animationId  = animationId;
            }
        }
        _Window_BattleLog_startAction.apply(this, arguments);
    };

    const _Window_BattleLog_endAction      = Window_BattleLog.prototype.endAction;
    Window_BattleLog.prototype.endAction = function(subject) {
        _Window_BattleLog_endAction.apply(this, arguments);
        if (this._noCritialAnimationId) {
            this._currentAction.item().animationId = this._noCritialAnimationId;
            this._noCritialAnimationId = 0;
        }
        this._currentAction = null;
    };

    const _Window_BattleLog_displayCritical = Window_BattleLog.prototype.displayCritical;
    Window_BattleLog.prototype.displayCritical = function(target) {
        if (target.result().critical && param.commonSe　&& param.commonSe.name) {
            AudioManager.playSe(param.commonSe);
        }
        if (this._suppressCritialMessage) {
            this._suppressCritialMessage = false;
            return;
        }
        _Window_BattleLog_displayCritical.apply(this, arguments);
    };

    Window_BattleLog.prototype.showCriticalEffect = function(subject) {
        const message = subject.findCriticalEffect(['CCメッセージ', 'CCMessage']) || param.commonMessage;
        if (message) {
            if (param.suppressDefault) {
                this._suppressCritialMessage = true;
            }
            this.push('addText', message);
        }
        const animationId = subject.findCriticalEffect(['CC演出', 'CCAnimation']) || param.commonAnimation;
        if (animationId > 0 && $dataAnimations[animationId]) {
            this.push('showNormalAnimation', [subject], animationId);
            this.push('waitForAnimation');
        }
    };

    const _Window_BattleLog_updateWaitMode      = Window_BattleLog.prototype.updateWaitMode;
    Window_BattleLog.prototype.updateWaitMode = function() {
        let waiting = false;
        if (this._waitMode === 'animation') {
            waiting = this._spriteset.isAnimationPlaying();
        }
        if (!waiting) {
            waiting = _Window_BattleLog_updateWaitMode.apply(this, arguments);
        }
        return waiting;
    };

    Window_BattleLog.prototype.waitForAnimation = function() {
        this.setWaitMode('animation');
    };
})();
