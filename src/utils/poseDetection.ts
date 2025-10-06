import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';

export class JumpingJackDetector {
    private detector: poseDetection.PoseDetector | null = null;
    private lastPosition: 'up' | 'down' | null = null;
    private isInitialized = false;

    async initialize() {
        if (this.isInitialized) return;

        await tf.ready();
        const model = poseDetection.SupportedModels.MoveNet;
        const detectorConfig = {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        };
        this.detector = await poseDetection.createDetector(model, detectorConfig);
        this.isInitialized = true;
    }

    async detectJumpingJack(video: HTMLVideoElement): Promise<{
        valid: boolean;
        completed: boolean;
        confidence: number;
    }> {
        if (!this.detector || !this.isInitialized) {
            return { valid: false, completed: false, confidence: 0 };
        }

        const poses = await this.detector.estimatePoses(video);

        if (poses.length === 0) {
            return { valid: false, completed: false, confidence: 0 };
        }

        const pose = poses[0];
        const keypoints = pose.keypoints;

        const leftShoulder = keypoints.find(kp => kp.name === 'left_shoulder');
        const rightShoulder = keypoints.find(kp => kp.name === 'right_shoulder');
        const leftWrist = keypoints.find(kp => kp.name === 'left_wrist');
        const rightWrist = keypoints.find(kp => kp.name === 'right_wrist');
        const leftAnkle = keypoints.find(kp => kp.name === 'left_ankle');
        const rightAnkle = keypoints.find(kp => kp.name === 'right_ankle');
        const leftHip = keypoints.find(kp => kp.name === 'left_hip');
        const rightHip = keypoints.find(kp => kp.name === 'right_hip');

        if (!leftShoulder || !rightShoulder || !leftWrist || !rightWrist ||
            !leftAnkle || !rightAnkle || !leftHip || !rightHip) {
            return { valid: false, completed: false, confidence: 0 };
        }

        const minConfidence = 0.3;
        if (leftShoulder.score! < minConfidence || rightShoulder.score! < minConfidence ||
            leftWrist.score! < minConfidence || rightWrist.score! < minConfidence) {
            return { valid: false, completed: false, confidence: 0 };
        }

        const avgConfidence = (leftShoulder.score! + rightShoulder.score! +
            leftWrist.score! + rightWrist.score!) / 4;

        const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
        const leftArmUp = leftWrist.y < shoulderMidY - 50;
        const rightArmUp = rightWrist.y < shoulderMidY - 50;
        const armsUp = leftArmUp && rightArmUp;

        const hipWidth = Math.abs(rightHip.x - leftHip.x);
        const ankleWidth = Math.abs(rightAnkle.x - leftAnkle.x);
        const legsSpread = ankleWidth > hipWidth * 1.3;

        const currentPosition = armsUp && legsSpread ? 'up' : 'down';

        let completed = false;
        if (this.lastPosition === 'down' && currentPosition === 'up') {
            completed = true;
        }

        this.lastPosition = currentPosition;

        return {
            valid: armsUp || legsSpread,
            completed,
            confidence: avgConfidence
        };
    }

    reset() {
        this.lastPosition = null;
    }

    async dispose() {
        if (this.detector) {
            this.detector.dispose();
            this.detector = null;
            this.isInitialized = false;
        }
    }
}
