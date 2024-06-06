//=============================================================================
// AccumulateState.js
// ----------------------------------------------------------------------------
// (C)2016 Triacontane
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
// ----------------------------------------------------------------------------
// Version
// 2.5.0 2024/04/10 Added a function to reset the accumulation rate when the release condition of the accumulated state is "Release at the end of battle".
// 2.4.2 2023/02/12 Fixed an issue that could cause an error when loading save data without the plugin applied.
// 2.4.1 2022/05/25 Fixed an issue where unnecessary gauges may be displayed due to the fix in 2.4.0.
// 2.4.0 2022/03/18 Modified to display accumulation gauge on map screen and status screen.
// 2.3.0 2021/07/23 Added the ability to display accumulation gauges for enemy characters.
// 2.2.1 2021/07/16 Added a function to increase resistance each time an accumulative state takes effect.
// 2.2.0 2021/07/15 Completely rewritten to work with MZ.
// 2.1.0 2021/07/15 Added the ability to toggle the display of the accumulation gauge with a switch.
// 2.0.0 2017/05/29 Changed the specification so that the accumulation rate calculation formula can be specified independently. Added a function to set the presence or absence of luck correction and certain hit correction.
// 1.1.1 2017/05/28 Fixed an issue where the accumulation rate was subtracted when the result of the subtraction was negative.
// 1.1.0 2017/05/28 Two resistance calculation formulas, division and subtraction, are now available.
// 1.0.1 2016/05/31 Fixed an issue where an error may occur if you enter a battle other than a battle test.
// 1.0.0 2016/05/28 First edition
// ----------------------------------------------------------------------------
// [Blog]   : https://triacontane.blogspot.jp/
// [Twitter]: https://twitter.com/triacontane/
// [GitHub] : https://github.com/triacontane/
//=============================================================================

/*:
 * @plugindesc Accumulative State Plugin
 * @target MZ
 * @url https://github.com/triacontane/RPGMakerMV/tree/mz_master/AccumulateState.js
 * @base PluginCommonBase
 * @orderAfter PluginCommonBase
 * @author Triacontane
 *
 * @param GaugeImage
 * @text Gauge Image File
 * @desc The image file (img/pictures) to use for the gauge display. Please combine the empty gauge and the full gauge vertically into one image.
 * @default
 * @dir img/pictures/
 * @type file
 *
 * @param GaugeSwitchId
 * @text Gauge Display Switch
 * @desc If enabled, the gauge will only be displayed when the specified switch is ON.
 * @default 0
 * @type switch
 *
 * @param AccumulateFormula
 * @text Accumulation Rate Calculation Formula
 * @desc Create your own formula for calculating the accumulation rate from the effect's "State Infliction" and the target's "State Effectiveness".
 * @default
 *
 * @param LuckAdjust
 * @text Luck Correction
 * @desc If ON, a luck-based correction will be applied to the accumulation rate. (Based on default specifications)
 * @default true
 * @type boolean
 *
 * @param CertainHit
 * @text Ignore Effectiveness on Certain Hit
 * @desc If ON, the "State Infliction" value will be directly reflected in the accumulation rate for certain hit skills.
 * @default true
 * @type boolean
 *
 * @param ImmunityRate
 * @text Immunity Rate
 * @desc Resistance value added each time a state takes effect. At 100, it will not increase at all.
 * @default 0
 * @type number
 *
 * @param ResetAccumulateEndBattle
 * @text Reset at End of Battle
 * @desc If the accumulated state release condition "Release at end of battle" is enabled, the accumulated rate will be reset at the end of battle.
 * @default false
 * @type boolean
 *
 * @command ACCUMULATE
 * @text Accumulate
 * @desc Increases or decreases the state accumulation amount of the specified actor.
 *
 * @arg actorId
 * @text Actor ID
 * @desc Target actor ID. If the target is an enemy character, leave it at 0.
 * @default 0
 * @type actor
 *
 * @arg enemyIndex
 * @text Enemy Character Index
 * @desc Enemy character index of the target. If the target is an actor, leave it at -1.
 * @default -1
 * @type number
 * @min -1
 *
 * @arg stateId
 * @text State ID
 * @desc The state ID of the target. Specify an accumulative state.
 * @default 1
 * @type state
 *
 * @arg rate
 * @text Accumulation Rate
 * @desc Accumulation rate (-100% to 100%).
 * @default 0
 * @type number
 * @min -100
 * @max 100
 *
 * @help Change specific states to accumulative type.
 * To make a state accumulative, set it in the memo field as follows:
 * <Accumulate>
 *
 * Accumulative states accumulate value through the use effect "State Infliction",
 * and when the accumulation rate exceeds 100% (=1.0), the target state becomes active.
 * The calculation formula is as follows:
 *
 * Effect "State Infliction" setting value * Target's "State Effectiveness" = Accumulation Rate
 * Example: If the effect "State Infliction" is 80% (0.8) and the target's state effectiveness is 50% (0.5)
 * 0.8 * 0.5 = 0.4         # The accumulation rate is 40% (0.4)
 *
 * As a more advanced feature, you can specify a separate accumulation rate calculation formula.
 * The following variables can be used in the formula:
 *
 * a : Effect "State Infliction" setting value
 * b : Target's "State Effectiveness" setting value
 *
 * Example of specifying accumulation rate calculation formula
 * a - (1.0 - b)
 *
 * Example: If the effect "State Infliction" is 80% (0.8) and the target's state effectiveness is 50% (0.5)
 * 0.8 - (1.0 - 0.5) = 0.3  # The accumulation rate is 30% (0.3)
 *
 * If the accumulation rate is negative, it will be calculated as "0". If a buzzer sounds during execution,
 * there is a problem with the script description.
 * Press F8 to open the developer tools and check the contents.
 *
 * Also, "State Removal" will reset the accumulation rate.
 *
 * You can specify only one state to display as a gauge on the battle screen.
 * To use this feature, set it in the actor's memo field as follows:
 * <AccumulateGaugeState:3> // Displays accumulative state ID "3" as a gauge.
 * <AccumulateGaugeX:600>      // X-coordinate of the gauge.
 * <AccumulateGaugeY:400>      // Y-coordinate of the gauge.
 *
 * If you want to display the gauge on the map screen or status screen, please specify the coordinates.
 * <AccumulateMapGaugeX:600> // X-coordinate of the gauge on the map screen.
 * <AccumulateMapGaugeY:400> // Y-coordinate of the gauge on the map screen.
 * <AccumulateStatusGaugeX:600> // X-coordinate of the gauge on the status screen.
 * <AccumulateStatusGaugeY:400> // Y-coordinate of the gauge on the status screen.
 *
 * The gauge image uses the one specified in the parameters.
 *
 * Terms of Use:
 *  Modification and redistribution are allowed without permission of the author, and there are no restrictions on the usage form (commercial use, use in adult-only works, etc.).
 *  This plugin is now yours.
 */

(()=>{
    'use strict';
    const script = document.currentScript;
    const param = PluginManagerEx.createParameter(script);

    PluginManagerEx.registerCommand(script, 'ACCUMULATE', args => {
        const actor = $gameActors.actor(args.actorId);
        if (actor) {
            actor.accumulateState(args.stateId, args.rate / 100);
        }
        const enemy = $gameTroop.members()[args.enemyIndex];
        if (enemy) {
            enemy.accumulateState(args.stateId, args.rate / 100);
        }
    });

    //=============================================================================
    // Game_BattlerBase
    //  Manages state accumulation amount.
    //=============================================================================
    Game_BattlerBase.prototype.clearStateAccumulationsIfNeed = function () {
        if (!this._stateAccumulations) {
            this._stateAccumulations = {};
        }
        if (!this._stateImmunity) {
            this._stateImmunity = {};
        }
    };

    const _Game_BattlerBase_clearStates = Game_BattlerBase.prototype.clearStates;
    Game_BattlerBase.prototype.clearStates = function () {
        _Game_BattlerBase_clearStates.apply(this, arguments);
        this.clearStateAccumulationsIfNeed();
    };

    const _Game_BattlerBase_eraseState = Game_BattlerBase.prototype.eraseState;
    Game_BattlerBase.prototype.eraseState = function (stateId) {
        _Game_BattlerBase_eraseState.apply(this, arguments);
        this.clearStateAccumulationsIfNeed();
        delete this._stateAccumulations[stateId];
    };

    const _Game_Battler_removeState = Game_Battler.prototype.removeState;
    Game_Battler.prototype.removeState = function (stateId) {
        _Game_Battler_removeState.apply(this, arguments);
        this.clearStateAccumulationsIfNeed();
        delete this._stateAccumulations[stateId];
    };

    const _Game_BattlerBase_attackStates = Game_BattlerBase.prototype.attackStates;
    Game_BattlerBase.prototype.attackStates = function (accumulateFlg) {
        if (arguments.length === 0) accumulateFlg = false;
        const states = _Game_BattlerBase_attackStates.apply(this, arguments);
        return states.filter(function (stateId) {
            return BattleManager.isStateAccumulate(stateId) === accumulateFlg;
        }.bind(this));
    };

    Game_Battler.prototype.accumulateState = function (stateId, value) {
        this.clearStateAccumulationsIfNeed();
        if (BattleManager.isStateAccumulate(stateId)) {
            this._stateAccumulations[stateId] = (this._stateAccumulations[stateId] || 0) + value;
            if (!this.isStateAffected(stateId) && this._stateAccumulations[stateId] >= 1.0) {
                this.addState(stateId);
                this._stateImmunity[stateId] = (this._stateImmunity[stateId] || 0) + 1;
                return true;
            }
        }
        return false;
    };

    const _Game_Battler_removeBattleStates = Game_Battler.prototype.removeBattleStates;
    Game_Battler.prototype.removeBattleStates = function() {
        _Game_Battler_removeBattleStates.apply(this, arguments);
        if (param.ResetAccumulateEndBattle) {
            for (const stateId in this._stateAccumulations) {
                const state = $dataStates[stateId];
                if (state.removeAtBattleEnd && this._stateAccumulations[stateId] > 0) {
                    this._stateAccumulations[stateId] = 0
                }
            }
        }
    };

    Game_BattlerBase.prototype.getStateImmunity = function (stateId) {
        return (this._stateImmunity[stateId] * param.ImmunityRate / 100) || 0;
    };

    Game_BattlerBase.prototype.getStateAccumulation = function (stateId) {
        return this._stateAccumulations[stateId] || 0;
    };

    Game_BattlerBase.prototype.getGaugeStateAccumulation = function () {
        return this.getStateAccumulation(this.getGaugeStateId());
    };

    Game_BattlerBase.prototype.getGaugeX = function () {
        return this.getGaugeInfo(SceneManager.findAccumulateGaugeTagX());
    };

    Game_BattlerBase.prototype.getGaugeY = function () {
        return this.getGaugeInfo(SceneManager.findAccumulateGaugeTagY());
    };

    Game_BattlerBase.prototype.getGaugeStateId = function () {
        return this.getGaugeInfo(['蓄積ゲージステート', 'AccumulateGaugeState']);
    };

    Game_BattlerBase.prototype.getGaugeInfo = function (names) {
        return PluginManagerEx.findMetaValue(this.getData(), names);
    };

    Game_BattlerBase.prototype.getData = function () {
        return null;
    };

    Game_Actor.prototype.getData = function () {
        return this.actor();
    };

    Game_Enemy.prototype.getData = function () {
        return this.enemy();
    };

    const _Game_System_onAfterLoad = Game_System.prototype.onAfterLoad;
    Game_System.prototype.onAfterLoad = function() {
        _Game_System_onAfterLoad.apply(this, arguments);
        $gameActors.clearStateAccumulationsIfNeed();
    };

    Game_Actors.prototype.clearStateAccumulationsIfNeed = function() {
        this._data.forEach(actor => {
            if (actor) {
                actor.clearStateAccumulationsIfNeed();
            }
        });
    };

    SceneManager.findAccumulateGaugeTagX = function() {
        if (this._scene instanceof Scene_Map) {
            return ['蓄積マップゲージX', 'AccumulateMapGaugeX'];
        }
        if (this._scene instanceof Scene_Status) {
            return ['蓄積ステータスゲージX', 'AccumulateStatusGaugeX'];
        }
        return ['蓄積ゲージX', 'AccumulateGaugeX'];
    };

    SceneManager.findAccumulateGaugeTagY = function() {
        if (this._scene instanceof Scene_Map) {
            return ['蓄積マップゲージY', 'AccumulateMapGaugeY'];
        }
        if (this._scene instanceof Scene_Status) {
            return ['蓄積ステータスゲージY', 'AccumulateStatusGaugeY'];
        }
        return ['蓄積ゲージY', 'AccumulateGaugeY'];
    };

    //=============================================================================
    // Game_Action
    //  Increases state accumulation amount by action.
    //=============================================================================
    const _Game_Action_itemEffectAddAttackState = Game_Action.prototype.itemEffectAddAttackState;
    Game_Action.prototype.itemEffectAddAttackState = function (target, effect) {
        _Game_Action_itemEffectAddAttackState.apply(this, arguments);
        this.subject().attackStates(true).forEach(stateId => {
            let accumulation = effect.value1 * this.subject().attackStatesRate(stateId);
            accumulation = this.applyResistanceForAccumulateState(accumulation, target, stateId);
            const result = target.accumulateState(stateId, accumulation);
            if (result) this.makeSuccess(target);
        });
    };

    const _Game_Action_itemEffectAddNormalState = Game_Action.prototype.itemEffectAddNormalState;
    Game_Action.prototype.itemEffectAddNormalState = function (target, effect) {
        if (BattleManager.isStateAccumulate(effect.dataId)) {
            let accumulation = effect.value1;
            if (!this.isCertainHit() || !param.CertainHit) {
                accumulation = this.applyResistanceForAccumulateState(accumulation, target, effect.dataId);
            }
            const result = target.accumulateState(effect.dataId, accumulation);
            if (result) this.makeSuccess(target);
        } else {
            _Game_Action_itemEffectAddNormalState.apply(this, arguments);
        }
    };

    Game_Action.prototype.applyResistanceForAccumulateState = function (effectValue, target, stateId) {
        if (param.AccumulateFormula) {
            const a = effectValue;
            const b = target.stateRate(stateId);
            try {
                effectValue = eval(param.AccumulateFormula);
            } catch (e) {
                SoundManager.playBuzzer();
                console.warn('Script Error : ' + param.AccumulateFormula);
                console.warn(e.stack);
            }
        } else {
            effectValue *= target.stateRate(stateId);
        }
        if (param.LuckAdjust) {
            effectValue *= this.lukEffectRate(target);
        }
        effectValue *= (1.0 - target.getStateImmunity(stateId));
        return effectValue.clamp(0.0, 1.0);
    };

    //=============================================================================
    // BattleManager
    //  Determines if the state is accumulative.
    //=============================================================================
    BattleManager.isStateAccumulate = function (stateId) {
        return stateId > 0 && !!PluginManagerEx.findMetaValue($dataStates[stateId], ['蓄積型', 'Accumulate']);
    };

    //=============================================================================
    // Scene_Base
    //  Creates the state gauge.
    //=============================================================================
    Scene_Battle.prototype.createAccumulateState = function (detailMenu) {
        Scene_Base.prototype.createAccumulateState.call(this, detailMenu);
        for (let i = 0, n = $gameTroop.members().length; i < n; i++) {
            const sprite = new Sprite_AccumulateState(i, $gameTroop, false);
            this.addChild(sprite);
        }
    };

    Scene_Base.prototype.createAccumulateState = function (detailMenu) {
        for (let i = 0, n = $gameParty.members().length; i < n; i++) {
            const sprite = new Sprite_AccumulateState(i, $gameParty, detailMenu);
            this.addChild(sprite);
        }
    };

    const _Scene_Battle_createSpriteset = Scene_Battle.prototype.createSpriteset;
    Scene_Battle.prototype.createSpriteset = function () {
        _Scene_Battle_createSpriteset.apply(this, arguments);
        this.createAccumulateState(false);
    };

    const _Scene_Map_createSpriteset = Scene_Map.prototype.createSpriteset;
    Scene_Map.prototype.createSpriteset = function () {
        _Scene_Map_createSpriteset.apply(this, arguments);
        this.createAccumulateState(false);
    };

    const _Scene_Status_create = Scene_Status.prototype.create;
    Scene_Status.prototype.create = function() {
        _Scene_Status_create.apply(this, arguments);
        this.createAccumulateState(true);
    };

    //=============================================================================
    // Sprite_AccumulateState
    //  Sprite for displaying state accumulation.
    //=============================================================================
    function Sprite_AccumulateState() {
        this.initialize.apply(this, arguments);
    }

    Sprite_AccumulateState.prototype = Object.create(Sprite.prototype);
    Sprite_AccumulateState.prototype.constructor = Sprite_AccumulateState;

    Sprite_AccumulateState.prototype.initialize = function (index, unit, detailMenu) {
        this._index = index;
        this._battler = null;
        this._unit = unit;
        this._rate = null;
        this._detailMenu = detailMenu;
        Sprite.prototype.initialize.call(this);
        this.create();
    };

    Sprite_AccumulateState.prototype.getBattler = function () {
        return this._unit.members()[this._index];
    };

    Sprite_AccumulateState.prototype.create = function () {
        this.bitmap = ImageManager.loadPicture(param.GaugeImage);
        this.createGaugeSprite();
        this.bitmap.addLoadListener(this.onLoadBitmap.bind(this));
        this.visible = false;
    };

    Sprite_AccumulateState.prototype.createGaugeSprite = function () {
        this._gaugeSprite = new Sprite();
        this._gaugeSprite.bitmap = this.bitmap;
        this.addChild(this._gaugeSprite);
    };

    Sprite_AccumulateState.prototype.onLoadBitmap = function () {
        const height = this.bitmap.height / 2;
        this.setFrame(0, height, this.bitmap.width, height);
        this._gaugeSprite.setFrame(0, 0, this.bitmap.width, height);
    };

    Sprite_AccumulateState.prototype.update = function () {
        const battler = this.getBattler();
        if (!battler) return;
        if (this._battler !== battler) {
            this._battler = battler;
        }
        this.updateVisibility();
        if (this.visible) {
            this.updatePosition();
            this.updateRate();
        }
    };

    Sprite_AccumulateState.prototype.updateVisibility = function () {
        this.visible = true;
        const stateId = this._battler.getGaugeStateId();
        if (!stateId) {
            this.visible = false;
        }
        if (param.GaugeSwitchId && !$gameSwitches.value(param.GaugeSwitchId)) {
            this.visible = false;
        }
        if (this._detailMenu && $gameParty.menuActor() !== this._battler) {
            this.visible = false;
        }
    };

    Sprite_AccumulateState.prototype.updateRate = function () {
        const rate = Math.min(this._battler.getGaugeStateAccumulation(), 1.0);
        if (rate !== this._rate) {
            this._rate = rate;
            this.bitmap.addLoadListener(function () {
                this._gaugeSprite.setFrame(0, 0, this.bitmap.width * rate, this.bitmap.height / 2);
            }.bind(this));
        }
    };

    Sprite_AccumulateState.prototype.updatePosition = function () {
        this.x = this._battler.getGaugeX();
        this.y = this._battler.getGaugeY();
    };
})();