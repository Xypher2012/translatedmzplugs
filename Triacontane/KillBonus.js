//=============================================================================
// KillBonus.js
// ----------------------------------------------------------------------------
// (C)2016 Triacontane
// This software is released under the MIT License.
// http://opensource.org/licenses/mit-license.php
// ----------------------------------------------------------------------------
// Version
// 2.1.1 2023/07/07 Fixed an issue where decimal values could occur when changing the experience and gold rates.
// 2.1.0 2023/01/09 Added "When using a specific skill" to the kill bonus application conditions
// 2.0.1 2022/09/04 Added specifications regarding drop rate to the help section.
// 2.0.0 2022/09/04 Redesigned for MZ.
// 1.4.0 2020/03/10 Added the ability to play animations on bonus targets when kill bonuses occur.
// 1.3.0 2019/11/09 Added defeat within specified turns and critical defeat to the conditions. Added the first drop item probability change to the bonus.
// 1.2.0 2019/06/11 Added the ability to increase or decrease any variable as a kill bonus.
// 1.1.0 2017/06/08 Added no damage, no death, no skill and switch as bonus acquisition conditions.
// 1.0.0 2016/08/07 Initial version.
// ----------------------------------------------------------------------------
// [Blog]   : https://triacontane.blogspot.jp/
// [Twitter]: https://twitter.com/triacontane/
// [GitHub] : https://github.com/triacontane/
//=============================================================================

/*:
 * @plugindesc Kill Bonus Plugin
 * @target MZ
 * @url https://github.com/triacontane/RPGMakerMV/tree/mz_master/KillBonus.js
 * @base PluginCommonBase
 * @orderAfter PluginCommonBase
 * @author Triacontane
 *
 * @param bonusList
 * @text Bonus Settings List
 * @desc List of kill bonus settings.
 * @default []
 * @type struct<Setting>[]
 *
 * @help KillBonus.js
 *
 * You can get some kind of reward for defeating an enemy.
 * Rewards are mainly as follows:
 * ・Parameter recovery
 * ・Reward rate, acquisition rate change
 * ・Variable addition, script execution
 * ・State application
 * ・Animation display
 *
 * You can create states and equipment that restore HP and MP when defeating enemies.
 * Please specify the specific content of the reward in the plugin parameters.
 *
 * In the memo field of the database (actor, class, weapon, state, enemy character) with features,
 * Please describe as follows.
 * If the "defeater" has the bonus feature, they will receive a kill bonus.
 *
 * bonus01 : Identifier specified in the plugin parameter
 * <KillBonus:bonus01>
 *
 * ※1 If multiple kill bonuses are active, the highest value for experience, gold rate, and drop rate will be used.
 *
 * ※2 Specifying 0 for the drop rate will result in the default drop rate specified in the database.
 *
 * Terms of use:
 *  Modification and redistribution are allowed without permission of the author, and there are no restrictions on usage (commercial, 18+, etc.).
 *  This plugin is now yours.
 */

/*~struct~Setting:
 *
 * @param id
 * @text Identifier
 * @desc Identifier. Please specify a unique value. This value is specified in the memo field.
 * @default bonus01
 *
 * @param hp
 * @text HP Recovery
 * @desc Restores HP by the specified amount.
 * @default 0
 * @type number
 * @min -99999
 * @max 99999
 *
 * @param hpRate
 * @text HP Recovery Rate
 * @desc HP recovers by the specified percentage (0-100).
 * @default 0
 * @type number
 * @min 0
 * @max 100
 *
 * @param mp
 * @text MP Recovery
 * @desc Restores MP by the specified amount.
 * @default 0
 * @type number
 * @min -99999
 * @max 99999
 *
 * @param mpRate
 * @text MP Recovery Rate
 * @desc MP recovers by the specified percentage (0-100).
 * @default 0
 * @type number
 * @min 0
 * @max 100
 *
 * @param tp
 * @text TP Recovery
 * @desc Restores TP by the specified amount.
 * @default 0
 * @type number
 * @min -99999
 * @max 99999
 *
 * @param tpRate
 * @text TP Recovery Rate
 * @desc TP recovers by the specified percentage (0-100).
 * @default 0
 * @type number
 * @min 0
 * @max 100
 *
 * @param gold
 * @text Gold
 * @desc Directly gain the specified amount of gold.
 * @default 0
 * @type number
 *
 * @param goldRate
 * @text Gold Rate
 * @desc The amount of gold acquired by the target will fluctuate by the specified rate.
 * @default 100
 * @type number
 *
 * @param expRate
 * @text Experience Rate
 * @desc The amount of experience points acquired by the target will fluctuate by the specified rate.
 * @default 100
 * @type number
 *
 * @param drop1Rate
 * @text Drop 1 Rate
 * @desc Changes the acquisition rate of drop item 1 to the specified value. The value specified in the database is ignored.
 * @default 0
 * @type number
 * @min 0
 * @max 100
 *
 * @param drop2Rate
 * @text Drop 2 Rate
 * @desc Changes the acquisition rate of drop item 2 to the specified value. The value specified in the database is ignored.
 * @default 0
 * @type number
 * @min 0
 * @max 100
 *
 * @param drop3Rate
 * @text Drop 3 Rate
 * @desc Changes the acquisition rate of drop item 3 to the specified value. The value specified in the database is ignored.
 * @default 0
 * @type number
 * @min 0
 * @max 100
 *
 * @param state
 * @text State
 * @desc Applies the specified state to yourself.
 * @default 0
 * @type state
 *
 * @param stateParty
 * @text Party State
 * @desc Applies the state to all party members.
 * @default 0
 * @type state
 *
 * @param stateTroop
 * @text Enemy Group State
 * @desc Applies the state to all members of the enemy group.
 * @default 0
 * @type state
 *
 * @param variableId
 * @text Variable ID
 * @desc The variable ID of the variable you want to add to.
 * @default 0
 * @type variable
 *
 * @param variableValue
 * @text Variable Value
 * @desc Variable addition value.
 * @default 0
 * @type number
 * @min -999999
 * @parent variableId
 *
 * @param script
 * @text Script
 * @desc Executes the specified script.
 * @default
 * @type multiline_string
 *
 * @param animationId
 * @text Animation
 * @desc You can play an animation when the kill bonus is activated.
 * @default 0
 * @type animation
 *
 * @param condition
 * @text Application Conditions
 * @desc Conditions for applying the kill bonus. If not specified, it will always apply.
 * @type struct<Condition>
 * @default
 *
 */

/*~struct~Condition:
 *
 * @param noDamage
 * @text No Damage
 * @desc The condition is met when defeated without taking damage.
 * @default false
 * @type boolean
 *
 * @param noSkill
 * @text No Skill Used
 * @desc The condition is met when defeated without using a skill.
 * @default false
 * @type boolean
 *
 * @param noDeath
 * @text No Death
 * @desc The condition is met when defeated without any party members falling.
 * @default false
 * @type boolean
 * 
 * @param critical
 * @text Critical
 * @desc The condition is met when defeated with a critical hit.
 * @default false
 * @type boolean
 * 
 * @param switchId
 * @text Switch
 * @desc The condition is met when the specified switch is ON.
 * @default 0
 * @type switch
 *
 * @param skillId
 * @text Skill ID
 * @desc The condition is met when defeated with a specific skill.
 * @default 0
 * @type skill
 * 
 * @param turnCount
 * @text Turn Count
 * @desc The condition is met when defeated within the specified number of turns.
 * @default 0
 * @type number
 * 
 * @param script
 * @text Script
 * @desc The condition is met when the specified script returns true.
 * @default 
 *
 */

(()=> {
    'use strict';
    const script = document.currentScript;
    const param = PluginManagerEx.createParameter(script);
    if (!param.bonusList) {
        param.bonusList = [];
    }

    //=============================================================================
    // BattleManager
    //  Maintains skill and damage status.
    //=============================================================================
    const _BattleManager_setup = BattleManager.setup;
    BattleManager.setup = function(troopId, canEscape, canLose) {
        _BattleManager_setup.apply(this, arguments);
        $gameParty.members().forEach(member => member.initKillBonusCondition());
    };

    //=============================================================================
    // Game_BattlerBase
    //  Maintains skill and damage status.
    //=============================================================================
    Game_BattlerBase.prototype.initKillBonusCondition = function() {
        this._noSkill  = true;
        this._noDamage = true;
        this._noDeath  = true;
        this._usedSkillId = 0;
    };

    Game_BattlerBase.prototype.breakNoSkill = function() {
        this._noSkill  = false;
    };

    Game_BattlerBase.prototype.breakNoDamage = function() {
        this._noDamage  = false;
    };

    Game_BattlerBase.prototype.breakNoDeath = function() {
        this._noDeath  = false;
    };

    Game_BattlerBase.prototype.setUsedSkillId = function(skillId) {
        this._usedSkillId = skillId
    };

    Game_BattlerBase.prototype.findKillBonusParamList = function(critical) {
        return this.traitObjects()
            .map(obj => this.findKillBonusParam(obj))
            .filter(data => !!data && this.checkDataForKillBonus(data, critical));
    };

    Game_BattlerBase.prototype.findKillBonusParam = function(traitObj) {
        const id = PluginManagerEx.findMetaValue(traitObj, ['KillBonus', '撃破ボーナス']);
        return param.bonusList.filter(item => item.id === id)[0] || null;
    };

    Game_BattlerBase.prototype.checkDataForKillBonus = function(data, critical) {
        const condition = data.condition;
        if (!condition) {
            return true;
        }
        const conditions = [];
        conditions.push(() => condition.noDamage && !this._noDamage);
        conditions.push(() => condition.noSkill && !this._noSkill);
        conditions.push(() => condition.noDeath && !this._noDeath);
        conditions.push(() => condition.skillId && this._usedSkillId !== condition.skillId);
        conditions.push(() => condition.critical && !critical);
        conditions.push(() => condition.turnCount > 0 && condition.turnCount < $gameTroop.turnCount());
        conditions.push(() => condition.switchId > 0 && !$gameSwitches.value(condition.switchId));
        conditions.push(() => condition.script && !eval(condition.script));
        return !conditions.some(cond => cond.call(this));
    };

    const _Game_BattlerBase_die = Game_BattlerBase.prototype.die;
    Game_BattlerBase.prototype.die = function() {
        _Game_BattlerBase_die.apply(this, arguments);
        this.breakNoDeath();
    };

    //=============================================================================
    // Game_Battler
    //  Clears the no damage flag when taking damage.
    //=============================================================================
    const _Game_Battler_performDamage = Game_Battler.prototype.performDamage;
    Game_Battler.prototype.performDamage = function() {
        _Game_Battler_performDamage.apply(this, arguments);
        this.breakNoDamage();
    };

    //=============================================================================
    // Game_Action
    //  Applies the kill bonus.
    //=============================================================================
    const _Game_Action_testApply = Game_Action.prototype.testApply;
    Game_Action.prototype.testApply = function(target) {
        this._criticalForKillBonus = false;
        const result = _Game_Action_testApply.apply(this, arguments);
        if (result) {
            if (!this.isAttack() && !this.isGuard()) {
                this.subject().breakNoSkill();
            }
            if (DataManager.isSkill(this.item())) {
                this.subject().setUsedSkillId(this.item().id);
            }
        }
        return result;
    };

    const _Game_Action_applyCritical = Game_Action.prototype.applyCritical;
    Game_Action.prototype.applyCritical = function(damage) {
        this._criticalForKillBonus = true;
        return _Game_Action_applyCritical.apply(this, arguments);
    };

    const _Game_Action_executeHpDamage      = Game_Action.prototype.executeHpDamage;
    Game_Action.prototype.executeHpDamage = function(target, value) {
        _Game_Action_executeHpDamage.apply(this, arguments);
        if (target.hp === 0) {
            this.executeKillBonus(target);
        }
    };

    Game_Action.prototype.executeKillBonus = function(target) {
        const subject = this.subject();
        if (!subject) {
            return;
        }
        this._gainHp = 0;
        this._gainMp = 0;
        this._gainTp = 0;
        target.clearRewardRate();
        subject.findKillBonusParamList(this._criticalForKillBonus).forEach(data => {
            this.executeKillBonusRecover(data, subject);
            this.executeKillBonusState(data, subject);
            this.executeKillBonusVariable(data);
            this.executeKillBonusScript(data, subject, target);
            this.executeKillBonusReward(data, target);
            this.executeKillBonusAnimation(data, subject);
        });
        if (this._gainHp !== 0) subject.gainHp(this._gainHp);
        if (this._gainMp !== 0) subject.gainMp(this._gainMp);
        if (this._gainTp !== 0) subject.gainTp(this._gainTp);
    };

    Game_Action.prototype.executeKillBonusAnimation = function(data, subject) {
        const id = data.animationId
        if (id > 0) {
            $gameTemp.requestAnimation([subject], id, false);
        }
    };

    Game_Action.prototype.executeKillBonusRecover = function(data, subject) {
        if (data.hp) {
            this._gainHp += data.hp;
        }
        if (data.hpRate) {
            this._gainHp += Math.floor(subject.mhp * data.hpRate / 100);
        }
        if (data.mp) {
            this._gainMp += data.mp;
        }
        if (data.mpRate) {
            this._gainMp += Math.floor(subject.mhp * data.mpRate / 100);
        }
        if (data.tp) {
            this._gainTp += data.tp;
        }
        if (data.tpRate) {
            this._gainTp += Math.floor(subject.maxTp() * data.tpRate / 100);
        }
    };

    Game_Action.prototype.executeKillBonusVariable = function(data) {
        const id = data.variableId;
        if (id) {
            $gameVariables.setValue(id, $gameVariables.value(id) + data.variableValue);
        }
    };

    Game_Action.prototype.executeKillBonusState = function(data, subject) {
        if (data.state) {
            subject.addState(data.state);
        }
        if (data.stateParty) {
            subject.friendsUnit().members().forEach(member => member.addState(data.stateParty));
        }
        if (data.stateTroop) {
            subject.opponentsUnit().members().forEach(member => member.addState(data.stateTroop));
        }
    };

    Game_Action.prototype.executeKillBonusScript = function(data, subject, target) {
        if (data.script) {
            try {
                eval(data.script);
            } catch (e) {
                console.error(e.stack);
            }
        }
    };

    Game_Action.prototype.executeKillBonusReward = function(data, target) {
        if (data.gold) {
            $gameParty.gainGold(data.gold);
        }
        target.setRewardRate(data.drop1Rate, data.drop2Rate, data.drop3Rate, data.goldRate, data.expRate);
    };

    /**
     * Game_Enemy
     * Implements drop rate changes.
     */
    Game_Battler.prototype.setRewardRate = function(drop1Rate, drop2Rate, drop3Rate, goldRate, expRate) {
        const rate = this._customRewardRate;
        if (this._customRewardRate) {
            rate.dropRate[0] = Math.max(rate.dropRate[0], drop1Rate);
            rate.dropRate[1] = Math.max(rate.dropRate[1], drop2Rate);
            rate.dropRate[2] = Math.max(rate.dropRate[2], drop3Rate);
            rate.goldRate = Math.max(rate.goldRate, goldRate);
            rate.expRate = Math.max(rate.expRate, expRate);
        } else {
            this._customRewardRate = {
                dropRate: [drop1Rate, drop2Rate, drop3Rate],
                goldRate: goldRate,
                expRate: expRate
            };
        }
    };

    Game_Battler.prototype.clearRewardRate = function () {
        this._customRewardRate = null;
    }

    const _Game_Enemy_exp = Game_Enemy.prototype.exp;
    Game_Enemy.prototype.exp = function() {
        const exp = _Game_Enemy_exp.apply(this, arguments);
        if (this._customRewardRate?.expRate) {
            return Math.floor(exp * this._customRewardRate.expRate / 100);
        } else {
            return exp;
        }
    };

    const _Game_Enemy_gold = Game_Enemy.prototype.gold;
    Game_Enemy.prototype.gold = function() {
        const gold = _Game_Enemy_gold.apply(this, arguments);
        if (this._customRewardRate?.goldRate) {
            return Math.floor(gold * this._customRewardRate.goldRate / 100);
        } else {
            return gold;
        }
    };

    const _Game_Enemy_makeDropItems = Game_Enemy.prototype.makeDropItems;
    Game_Enemy.prototype.makeDropItems = function() {
        const prevItems = _Game_Enemy_makeDropItems.apply(this, arguments);
        const newRate = this._customRewardRate?.dropRate || [];
        if (newRate[0] || newRate[1] || newRate[2]) {
            const rate = this.dropItemRate();
            return this.enemy().dropItems.reduce((r, dropItem, index) => {
                const customResult = newRate[index] ? Math.random() < newRate[index] / 100 : Math.random() * dropItem.denominator < rate;
                if (dropItem.kind > 0 && customResult) {
                    return r.concat(this.itemObject(dropItem.kind, dropItem.dataId));
                } else {
                    return r;
                }
            }, []);
        } else {
            return prevItems;
        }
    };
})();
